import { webcrypto } from 'node:crypto'
import { defineComponent, h, ref } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, enableAutoUnmount } from '@vue/test-utils'
import TryItAuthCode from './TryItAuthCode.vue'
import composables from '@/composables'
import { buildPkceTarget } from '@/utils/oauth-pkce'
import { OAUTH_MESSAGE_TYPE } from '@/utils/oauth-popup'
import type { PreRequestAuthResult } from '@/types'
import type { IOauth2SecurityScheme } from '@stoplight/types'

// jsdom has crypto.getRandomValues but no crypto.subtle
beforeAll(() => {
  vi.stubGlobal('crypto', webcrypto)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

enableAutoUnmount(afterEach)

const SCHEME_KEY = 'AuthCodeAuth'
const DATA_ID = 'op-1'
const REDIRECT_URI = 'https://host.test/cb'
const CLIENT_ID = 'my-client-id'

const scheme: IOauth2SecurityScheme = {
  id: 'auth-code-scheme',
  key: SCHEME_KEY,
  extensions: {},
  type: 'oauth2',
  description: 'OAuth2 authorization code flow',
  flows: {
    authorizationCode: {
      authorizationUrl: 'https://auth.example.com/authorize',
      tokenUrl: 'https://auth.example.com/token',
      scopes: {
        read: 'Grants read access',
        write: 'Grants write access',
      },
    },
  },
}

const badUrlScheme: IOauth2SecurityScheme = {
  ...scheme,
  flows: {
    authorizationCode: {
      authorizationUrl: '/relative/authorize',
      tokenUrl: 'https://auth.example.com/token',
      scopes: { read: 'Grants read access' },
    },
  },
}

const testId = (name: string) => `tryit-auth-${name}-${DATA_ID}`

// jsdom's window.open returns undefined, stand in a fake popup
const createFakePopup = () => ({
  closed: false,
  focus: vi.fn(),
  close: vi.fn(),
  location: { replace: vi.fn() },
})

let fakePopup: ReturnType<typeof createFakePopup>
let openSpy: ReturnType<typeof vi.spyOn>

const mountComponent = (options: { redirectUri?: string, scheme?: IOauth2SecurityScheme } = {}) => mount(TryItAuthCode, {
  props: {
    schemeKey: SCHEME_KEY,
    dataId: DATA_ID,
    scheme: options.scheme ?? scheme,
  },
  global: {
    provide: {
      'oauth-redirect-uri': ref(options.redirectUri ?? REDIRECT_URI),
    },
  },
  attachTo: document.body,
})

// mounts the panel under the same registry TryItAuth provides, so handlers run through the real code path
const mountWithRegistry = (panelScheme: IOauth2SecurityScheme = scheme) => {
  let runHandlers!: (schemeKeys: string[]) => Promise<PreRequestAuthResult>
  const Host = defineComponent({
    setup() {
      runHandlers = composables.usePreRequestAuth().providePreRequestAuth().runHandlers
      return () => h(TryItAuthCode, { schemeKey: SCHEME_KEY, dataId: DATA_ID, scheme: panelScheme })
    },
  })
  const wrapper = mount(Host, {
    global: { provide: { 'oauth-redirect-uri': ref(REDIRECT_URI) } },
    attachTo: document.body,
  })
  return { wrapper, runHandlers: () => runHandlers([SCHEME_KEY]) }
}

const setClientId = async (wrapper: ReturnType<typeof mountComponent>, value = CLIENT_ID) => {
  await wrapper.find('input[type="text"]').setValue(value)
}

const waitFor = async (predicate: () => boolean, timeoutMs = 2000): Promise<void> => {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('waitFor: condition was not met within the timeout')
    }
    await new Promise(resolve => setTimeout(resolve, 5))
  }
}

// waits for the popup to navigate to the authorize URL and returns it
const authorizeUrl = async (): Promise<URL> => {
  await waitFor(() => fakePopup.location.replace.mock.calls.length > 0)
  return new URL(fakePopup.location.replace.mock.calls.at(-1)![0])
}

// plays the callback page: posts a valid code with the real state
const answerPopup = async (): Promise<void> => {
  const url = await authorizeUrl()
  window.dispatchEvent(new MessageEvent('message', {
    data: { type: OAUTH_MESSAGE_TYPE, code: 'auth-code-1', state: url.searchParams.get('state') },
    origin: new URL(REDIRECT_URI).origin,
    source: fakePopup as unknown as Window,
  }))
}

// signs in through the real flow and resolves once the token is stored
const signIn = async (expiresIn = 3600): Promise<void> => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ access_token: 'tok-abc', token_type: 'Bearer', expires_in: expiresIn }),
  })
  const target = buildPkceTarget(scheme, CLIENT_ID)!
  const done = composables.useOAuthPkce().authorize({ target, clientId: CLIENT_ID, scopes: [], redirectUri: REDIRECT_URI })
  await answerPopup()
  await done
}

let originalFetch: typeof fetch

beforeAll(() => {
  originalFetch = global.fetch
})

afterAll(() => {
  global.fetch = originalFetch
})

beforeEach(() => {
  composables.useOAuthPkce().reset()

  const { authInputs, authHeadersMap, authQueryMap, activeSecurityScheme } = composables.useAuth()
  authInputs.value = {}
  authHeadersMap.value = {}
  authQueryMap.value = {}
  activeSecurityScheme.value = ''

  fakePopup = createFakePopup()
  openSpy = vi.spyOn(window, 'open').mockReturnValue(fakePopup as unknown as Window)
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.stubGlobal('crypto', webcrypto)
})

describe('<TryItAuthCode />', () => {
  it('stores the Client ID under the shared key', async () => {
    const wrapper = mountComponent()
    await setClientId(wrapper)

    expect(composables.useAuth().authInputs.value[`${SCHEME_KEY}-clientId`]).toBe(CLIENT_ID)
  })

  describe('Authorize button', () => {
    for (const { name, options, clientId, disabled } of [
      { name: 'is enabled when there is a target, a client ID and a redirect URI', options: {}, clientId: true, disabled: false },
      { name: 'is disabled without a client ID', options: {}, clientId: false, disabled: true },
      { name: 'is disabled without a redirect URI, even with a client ID', options: { redirectUri: '' }, clientId: true, disabled: true },
      { name: 'is disabled when the scheme has no usable target, even with a client ID', options: { scheme: badUrlScheme }, clientId: true, disabled: true },
    ]) {
      it(name, async () => {
        const wrapper = mountComponent(options)
        if (clientId) {
          await setClientId(wrapper)
        }

        const attr = wrapper.findTestId(testId('authorize')).attributes('disabled')
        if (disabled) {
          expect(attr).toBeDefined()
        } else {
          expect(attr).toBeUndefined()
        }
      })
    }

    it('is disabled and the Client ID input locked while authorizing', async () => {
      const wrapper = mountComponent()
      await setClientId(wrapper)

      await wrapper.findTestId(testId('authorize')).trigger('click')

      expect(composables.useOAuthPkce().statusFor(buildPkceTarget(scheme, CLIENT_ID)!)).toBe('authorizing')
      expect(wrapper.findTestId(testId('authorize')).attributes('disabled')).toBeDefined()
      expect(wrapper.find('input[type="text"]').attributes('disabled')).toBeDefined()
    })

    it('opens the popup synchronously inside the click, before any await', async () => {
      const wrapper = mountComponent()
      await setClientId(wrapper)

      // deliberately not awaited: the popup must open in the click's own task
      void wrapper.findTestId(testId('authorize')).trigger('click')

      expect(openSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('after signing in', () => {
    it('labels the button Authorize with no token, Re-authorize with one', async () => {
      const wrapper = mountComponent()
      await setClientId(wrapper)
      expect(wrapper.findTestId(testId('authorize')).text()).toBe('Authorize')

      await signIn()
      await wrapper.vm.$nextTick()

      expect(wrapper.findTestId(testId('authorize')).text()).toBe('Re-authorize')
    })

    it('shows Clear credentials only once a token exists, and clears it on click', async () => {
      const wrapper = mountComponent()
      await setClientId(wrapper)
      expect(wrapper.findTestId(testId('clear')).exists()).toBe(false)

      await signIn()
      await wrapper.vm.$nextTick()
      expect(wrapper.findTestId(testId('clear')).exists()).toBe(true)

      await wrapper.findTestId(testId('clear')).trigger('click')

      expect(composables.useOAuthPkce().statusFor(buildPkceTarget(scheme, CLIENT_ID)!)).toBe('unauthenticated')
      expect(wrapper.findTestId(testId('clear')).exists()).toBe(false)
    })
  })

  describe('messages', () => {
    it('says the scheme cannot be used when its URLs are not absolute http(s)', () => {
      const wrapper = mountComponent({ scheme: badUrlScheme })

      expect(wrapper.findTestId(testId('bad-target')).exists()).toBe(true)
      expect(wrapper.findTestId(testId('signin-host')).exists()).toBe(false)
    })

    it('does not show the bad target message for a valid scheme', () => {
      const wrapper = mountComponent()

      expect(wrapper.findTestId(testId('bad-target')).exists()).toBe(false)
    })
  })

  describe('sign-in host line', () => {
    it('shows the host of the authorization URL, not the token URL', () => {
      const wrapper = mountComponent({
        scheme: {
          ...scheme,
          flows: { authorizationCode: { ...scheme.flows.authorizationCode!, authorizationUrl: 'https://login.example.com/authorize' } },
        },
      })

      expect(wrapper.findTestId(testId('signin-host')).text()).toBe('You\'ll sign in at login.example.com')
    })
  })

  describe('scopes', () => {
    it('writes selected scopes under the namespaced key, never under the client credentials prefix', async () => {
      const wrapper = mountComponent()

      await wrapper.find('input[type="checkbox"]').setValue(true)

      const keys = Object.keys(composables.useAuth().authInputs.value)
      expect(keys.some(key => key.startsWith(`${SCHEME_KEY}-authorizationCode-scope-`))).toBe(true)
      expect(keys.some(key => key.startsWith(`${SCHEME_KEY}-scope-`))).toBe(false)
    })

    it('Select all and Deselect all write namespaced keys only', async () => {
      const wrapper = mountComponent()
      const { authInputs } = composables.useAuth()

      await wrapper.find(`[aria-label="Select all scopes for ${SCHEME_KEY}"]`).trigger('click')
      expect(authInputs.value[`${SCHEME_KEY}-authorizationCode-scope-read`]).toBe('true')
      expect(authInputs.value[`${SCHEME_KEY}-authorizationCode-scope-write`]).toBe('true')

      await wrapper.find(`[aria-label="Deselect all scopes for ${SCHEME_KEY}"]`).trigger('click')
      expect(authInputs.value[`${SCHEME_KEY}-authorizationCode-scope-read`]).toBe('false')
      expect(Object.keys(authInputs.value).some(key => key.startsWith(`${SCHEME_KEY}-scope-`))).toBe(false)
    })

    it('ignores client credentials style scope keys on authorize', async () => {
      const wrapper = mountComponent()
      await setClientId(wrapper)
      composables.useAuth().authInputs.value[`${SCHEME_KEY}-scope-read`] = 'true'
      composables.useAuth().authInputs.value[`${SCHEME_KEY}-authorizationCode-scope-write`] = 'true'

      await wrapper.findTestId(testId('authorize')).trigger('click')

      expect((await authorizeUrl()).searchParams.get('scope')).toBe('write')
    })
  })

  describe('error', () => {
    it('renders the sign-in error as an alert', async () => {
      const wrapper = mountComponent()
      await setClientId(wrapper)
      expect(wrapper.findTestId(testId('error')).exists()).toBe(false)

      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
      await wrapper.findTestId(testId('authorize')).trigger('click')
      await answerPopup()
      await waitFor(() => !!composables.useOAuthPkce().errorFor(buildPkceTarget(scheme, CLIENT_ID)!))
      await wrapper.vm.$nextTick()

      const error = wrapper.findTestId(testId('error'))
      expect(error.attributes('role')).toBe('alert')
      expect(error.text()).toBe('Unable to reach the token endpoint at https://auth.example.com.')
    })
  })

  describe('pre-request handler', () => {
    it('allows the request when unauthenticated', async () => {
      const { runHandlers } = mountWithRegistry()

      expect(await runHandlers()).toEqual({ ok: true })
    })

    it('allows the request when there is no usable target', async () => {
      const { runHandlers } = mountWithRegistry(badUrlScheme)

      expect(await runHandlers()).toEqual({ ok: true })
    })

    it('allows the request when authenticated', async () => {
      const { wrapper, runHandlers } = mountWithRegistry()
      await wrapper.find('input[type="text"]').setValue(CLIENT_ID)
      await signIn()

      expect(await runHandlers()).toEqual({ ok: true })
    })

    it('blocks the request with the session expired error when the token is expired', async () => {
      const { wrapper, runHandlers } = mountWithRegistry()
      await wrapper.find('input[type="text"]').setValue(CLIENT_ID)
      // 20s is inside the 30s expiry skew, so the token is expired as soon as it is stored
      await signIn(20)
      expect(composables.useOAuthPkce().statusFor(buildPkceTarget(scheme, CLIENT_ID)!)).toBe('expired')

      const result = await runHandlers()

      expect(result.ok).toBe(false)
      expect(result.ok === false && result.error?.message).toBe('Your session expired. Click Authorize to sign in again.')
    })
  })
})
