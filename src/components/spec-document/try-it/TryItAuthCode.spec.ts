import { webcrypto } from 'node:crypto'
import { ref } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import TryItAuthCode from './TryItAuthCode.vue'
import composables from '@/composables'
import { buildPkceTarget } from '@/utils/oauth-pkce'
import { OAUTH_MESSAGE_TYPE } from '@/utils/oauth-popup'
import type { IOauth2SecurityScheme } from '@stoplight/types'

// jsdom provides `crypto.getRandomValues` but not `crypto.subtle` - stub real WebCrypto
// in for the whole file, matching useOAuthPkce.spec.ts.
beforeAll(() => {
  vi.stubGlobal('crypto', webcrypto)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

enableAutoUnmount(afterEach)

const SCHEME_KEY = 'AuthCodeAuth'

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

// jsdom's `window.open` returns `undefined` - stand in a fake pop-up.
const createFakePopup = () => ({
  closed: false,
  focus: vi.fn(),
  close: vi.fn(),
  location: { replace: vi.fn() },
})

let fakePopup: ReturnType<typeof createFakePopup>

const mountComponent = (redirectUri = 'https://host.test/cb') => mount(TryItAuthCode, {
  props: {
    schemeKey: SCHEME_KEY,
    dataId: 'op-1',
    scheme,
  },
  global: {
    provide: {
      'oauth-redirect-uri': ref(redirectUri),
    },
  },
  attachTo: document.body, // required for any interaction with the DOM to work
})

beforeEach(() => {
  composables.useOAuthPkce().__resetForTests()

  const { authInputs, authHeadersMap, authQueryMap, activeSecurityScheme } = composables.useAuth()
  authInputs.value = {}
  authHeadersMap.value = {}
  authQueryMap.value = {}
  activeSecurityScheme.value = ''

  fakePopup = createFakePopup()
  vi.spyOn(window, 'open').mockReturnValue(fakePopup as unknown as Window)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.stubGlobal('crypto', webcrypto)
})

describe('<TryItAuthCode />', () => {
  it('renders a Client ID input and one checkbox per scope', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(2)
    expect(wrapper.html()).toContain('read')
    expect(wrapper.html()).toContain('write')
  })

  it('never renders a Client Secret field - the authorizationCode flow is a public client', () => {
    const wrapper = mountComponent()

    expect(wrapper.html()).not.toContain('Client Secret')
  })

  it('disables Authorize when Client ID is empty, enables it once filled', async () => {
    const wrapper = mountComponent()

    const authorizeButton = wrapper.findTestId('tryit-auth-authorize-op-1')
    expect(authorizeButton.attributes('disabled')).toBeDefined()

    await wrapper.find('input[type="text"]').setValue('my-client-id')

    expect(wrapper.findTestId('tryit-auth-authorize-op-1').attributes('disabled')).toBeUndefined()
  })

  it('disables Authorize and renders a hint when oauth-redirect-uri injects an empty string', async () => {
    const wrapper = mountComponent('')

    await wrapper.find('input[type="text"]').setValue('my-client-id')

    const authorizeButton = wrapper.findTestId('tryit-auth-authorize-op-1')
    expect(authorizeButton.attributes('disabled')).toBeDefined()
    expect(authorizeButton.attributes('title')).toBeTruthy()
    expect(wrapper.text()).toContain('oauthRedirectUri')
  })

  it('calls window.open when Authorize is clicked with a valid Client ID', async () => {
    const wrapper = mountComponent()
    const openSpy = vi.spyOn(window, 'open')

    await wrapper.find('input[type="text"]').setValue('my-client-id')
    await wrapper.findTestId('tryit-auth-authorize-op-1').trigger('click')

    expect(openSpy).toHaveBeenCalled()
  })

  it('shows Clear credentials only once a token exists, and reflects an authenticated status', async () => {
    const wrapper = mountComponent()
    await wrapper.find('input[type="text"]').setValue('my-client-id')

    expect(wrapper.findTestId('tryit-auth-clear-op-1').exists()).toBe(false)

    // Driving the full popup handshake through the component proved brittle in this
    // environment (the async PKCE-challenge digest races the component's own debounced
    // precompute), so the token is seeded directly through the composable, exactly as
    // `useOAuthPkce.spec.ts` does, and the component's reaction to that state is asserted.
    const target = buildPkceTarget(SCHEME_KEY, scheme, 'my-client-id')!
    const { authorize, statusFor } = composables.useOAuthPkce()

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok-abc', token_type: 'Bearer', expires_in: 3600 }),
    })

    const navCountBefore = fakePopup.location.replace.mock.calls.length
    const promise = authorize({ target, clientId: 'my-client-id', scopes: [], redirectUri: 'https://host.test/cb' })

    const start = Date.now()
    while (fakePopup.location.replace.mock.calls.length <= navCountBefore) {
      if (Date.now() - start > 2000) {
        throw new Error('timed out waiting for popup navigation')
      }
      await new Promise(resolve => setTimeout(resolve, 5))
    }

    const authorizeUrl = new URL(fakePopup.location.replace.mock.calls.at(-1)![0])
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: OAUTH_MESSAGE_TYPE, code: 'auth-code-1', state: authorizeUrl.searchParams.get('state') },
      origin: 'https://host.test',
      source: fakePopup as unknown as Window,
    }))
    await promise

    expect(statusFor(target)).toBe('authenticated')

    await flushPromises()
    expect(wrapper.findTestId('tryit-auth-clear-op-1').exists()).toBe(true)
  })

  it('namespaces scope keys under `-authorizationCode-scope-`, never leaking into the bare clientCredentials `-scope-` prefix', async () => {
    const wrapper = mountComponent()

    await wrapper.find('input[type="checkbox"]').setValue(true)

    const { authInputs } = composables.useAuth()
    const keys = Object.keys(authInputs.value)

    expect(keys.some(key => key.startsWith(`${SCHEME_KEY}-authorizationCode-scope-`))).toBe(true)
    expect(keys.some(key => key.startsWith(`${SCHEME_KEY}-scope-`))).toBe(false)
  })
})
