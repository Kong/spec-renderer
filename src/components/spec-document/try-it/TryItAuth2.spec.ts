import { computed } from 'vue'
import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import { mount, enableAutoUnmount } from '@vue/test-utils'
import TryItAuth2 from './TryItAuth2.vue'
import TryItAuth2ClientCredentials from './TryItAuth2ClientCredentials.vue'
import TryItAuthCode from './TryItAuthCode.vue'
import composables from '@/composables'
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

const mountDispatcher = (scheme: IOauth2SecurityScheme, redirectUri = 'https://host.test/cb') => mount(TryItAuth2, {
  props: { schemeKey: SCHEME_KEY, dataId: DATA_ID, scheme },
  global: { provide: { 'oauth-redirect-uri': computed(() => redirectUri) } },
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
})
