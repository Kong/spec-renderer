import { webcrypto } from 'node:crypto'
import { computed } from 'vue'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { mount, enableAutoUnmount } from '@vue/test-utils'
import TryItAuth2 from './TryItAuth2.vue'
import TryItAuth2ClientCredentials from './TryItAuth2ClientCredentials.vue'
import TryItAuthCode from './TryItAuthCode.vue'
import composables from '@/composables'
import { buildPkceTarget } from '@/utils/oauth-pkce'
import type { IOauth2SecurityScheme } from '@stoplight/types'

enableAutoUnmount(afterEach)

const SCHEME_KEY = 'OAuth'
const DATA_ID = 'op-1'

const clientCredentials = { tokenUrl: 'https://auth.example.com/token', scopes: { read: 'Read' } }
const authorizationCode = {
  authorizationUrl: 'https://auth.example.com/authorize',
  tokenUrl: 'https://auth.example.com/token',
  scopes: { read: 'Read' },
}

const buildScheme = (flows: IOauth2SecurityScheme['flows']): IOauth2SecurityScheme => ({
  id: 'oauth-scheme',
  key: SCHEME_KEY,
  extensions: {},
  type: 'oauth2',
  flows,
})

const mountDispatcher = (scheme: IOauth2SecurityScheme, redirectUri = 'https://host.test/cb', dataId = DATA_ID) => mount(TryItAuth2, {
  props: { schemeKey: SCHEME_KEY, dataId, scheme },
  global: { provide: { 'oauth-redirect-uri': computed(() => redirectUri) } },
  attachTo: document.body, // the toggle click needs an attached DOM
})

const ccHeading = `tryit-auth-flow-heading-clientCredentials-${DATA_ID}`
const pkceHeading = `tryit-auth-flow-heading-authorizationCode-${DATA_ID}`

describe('<TryItAuth2 />', () => {

  it('Should handle x-kong-client-credentials-config extension in auth2 clientCredentials', async () => {

    const wrapper = mount(TryItAuth2, {
      props: {
        'dataId': '4b9cfc2271c3f',
        'scheme': {
          'id': 'ca39a16b90492',
          'key': 'oauth2',
          'extensions': {
            'x-kong-client-credentials-config': {
              'extraTokenRequestParameters': [
                {
                  'name': 'organization',
                  'label': 'Organization',
                  'description': 'The organization identifier',
                  'omitIfEmpty': true,
                  'required': true,
                },
                {
                  'name': 'audience',
                  'label': 'Audience',
                  'value': 'https://api.audience.com/v1',
                },
              ],
            },
          },
          'type': 'oauth2',
          'flows': {
            'clientCredentials': {
              'scopes': {
                'read:products': 'Grants read access to products',
                'write:products': 'Grants write access to products',
              },
              'tokenUrl': 'https://example.com/oauth/token',
            },
          },
        },
        'schemeKey': 'oauth2',
      },
      global: {
        provide: {
        },
      },
    })
    expect(wrapper.html()).toContain('auth-input-oauth2-clientCredentials-organization-')
    expect(wrapper.html()).toContain('auth-input-oauth2-clientCredentials-audience-')
  })

  describe('flow dispatch', () => {
    beforeEach(() => {
      composables.useOAuthPkce().reset()
      composables.useAuth().authInputs.value = {}
    })

    it('renders only the client credentials panel, without headings, for a client credentials scheme', () => {
      const wrapper = mountDispatcher(buildScheme({ clientCredentials }))

      expect(wrapper.findComponent(TryItAuth2ClientCredentials).exists()).toBe(true)
      expect(wrapper.findComponent(TryItAuthCode).exists()).toBe(false)
      expect(wrapper.findTestId(ccHeading).exists()).toBe(false)
      expect(wrapper.findTestId(pkceHeading).exists()).toBe(false)
    })

    it('renders only the PKCE panel, without headings, for an authorization code scheme', () => {
      const wrapper = mountDispatcher(buildScheme({ authorizationCode }))

      expect(wrapper.findComponent(TryItAuthCode).exists()).toBe(true)
      expect(wrapper.findComponent(TryItAuth2ClientCredentials).exists()).toBe(false)
      expect(wrapper.findTestId(ccHeading).exists()).toBe(false)
      expect(wrapper.findTestId(pkceHeading).exists()).toBe(false)
    })

    it('renders both panels and both headings when the scheme declares both flows', () => {
      const wrapper = mountDispatcher(buildScheme({ clientCredentials, authorizationCode }))

      expect(wrapper.findComponent(TryItAuth2ClientCredentials).exists()).toBe(true)
      expect(wrapper.findComponent(TryItAuthCode).exists()).toBe(true)
      expect(wrapper.findTestId(ccHeading).text()).toBe('Client credentials')
      expect(wrapper.findTestId(pkceHeading).text()).toBe('Authorization code (PKCE)')
    })

    it('renders only the client credentials panel, without headings, for a dual-flow scheme without the redirect URI', () => {
      const wrapper = mountDispatcher(buildScheme({ clientCredentials, authorizationCode }), '')

      expect(wrapper.findComponent(TryItAuth2ClientCredentials).exists()).toBe(true)
      expect(wrapper.findComponent(TryItAuthCode).exists()).toBe(false)
      expect(wrapper.findTestId(ccHeading).exists()).toBe(false)
      expect(wrapper.findTestId(pkceHeading).exists()).toBe(false)
    })
  })

  describe('manual access token', () => {
    const { authInputs } = composables.useAuth()
    const SWITCH_CONTROL = '[data-testid="switch-control"]'
    const toggleId = (dataId = DATA_ID) => `tryit-auth-manual-toggle-${SCHEME_KEY}-${dataId}`
    const tokenId = (dataId = DATA_ID) => `tryit-auth-manual-token-${SCHEME_KEY}-${dataId}`
    const authorizeId = `tryit-auth-authorize-${DATA_ID}`
    const clickToggle = (wrapper: ReturnType<typeof mountDispatcher>, dataId = DATA_ID) =>
      wrapper.findTestId(toggleId(dataId)).find(SWITCH_CONTROL).trigger('click')

    beforeEach(() => {
      composables.useOAuthPkce().reset()
      authInputs.value = {}
    })

    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })

    it('swaps the sign-in fields for the token input in manual mode', async () => {
      const wrapper = mountDispatcher(buildScheme({ authorizationCode }))

      await clickToggle(wrapper)

      expect(composables.useOAuthPkce().isManual(SCHEME_KEY)).toBe(true)
      expect(wrapper.findTestId(tokenId()).exists()).toBe(true)
      expect(wrapper.findTestId(toggleId()).text()).toBe('Use access token')
      expect(wrapper.findComponent(TryItAuthCode).exists()).toBe(false)
      expect(wrapper.findTestId(authorizeId).exists()).toBe(false)
    })

    it('goes back to the sign-in and drops the pasted token', async () => {
      const wrapper = mountDispatcher(buildScheme({ authorizationCode }))
      await clickToggle(wrapper)
      await wrapper.findTestId(tokenId()).setValue('Bearer pasted-token')

      await clickToggle(wrapper)

      expect(composables.useOAuthPkce().isManual(SCHEME_KEY)).toBe(false)
      expect(authInputs.value[`${SCHEME_KEY}-token`]).toBe('')
      expect(wrapper.findComponent(TryItAuthCode).exists()).toBe(true)
      expect(wrapper.findTestId(authorizeId).exists()).toBe(true)
    })

    it('cancels a sign-in in progress when switching to the token input', async () => {
      // jsdom has crypto.getRandomValues but no crypto.subtle
      vi.stubGlobal('crypto', webcrypto)
      const popup = { closed: false, focus: vi.fn(), close: vi.fn(), location: { replace: vi.fn() } }
      vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
      const authScheme = buildScheme({ authorizationCode })
      const target = buildPkceTarget(authScheme, 'my-client-id')!
      const wrapper = mountDispatcher(authScheme)

      // the popup never answers, so the sign-in stays in progress
      const signIn = composables.useOAuthPkce().authorize({ target, clientId: 'my-client-id', scopes: [], redirectUri: 'https://host.test/cb' })
      expect(composables.useOAuthPkce().statusFor(target)).toBe('authorizing')

      await clickToggle(wrapper)
      await signIn

      expect(popup.close).toHaveBeenCalled()
      expect(composables.useOAuthPkce().statusFor(target)).toBe('unauthenticated')
      expect(composables.useOAuthPkce().errorFor(target)).toBeUndefined()
      expect(wrapper.findTestId(tokenId()).exists()).toBe(true)
    })

    it('syncs the mode and the pasted token across operations using the same scheme', async () => {
      const authScheme = buildScheme({ authorizationCode })
      const first = mountDispatcher(authScheme)
      const second = mountDispatcher(authScheme, 'https://host.test/cb', 'op-2')

      await clickToggle(first)
      expect(second.findTestId(tokenId('op-2')).exists()).toBe(true)

      await second.findTestId(tokenId('op-2')).setValue('Bearer pasted-token')
      expect((first.findTestId(tokenId()).element as HTMLInputElement).value).toBe('Bearer pasted-token')

      await clickToggle(second, 'op-2')
      expect(first.findComponent(TryItAuthCode).exists()).toBe(true)
    })
  })
})
