import { ref, nextTick } from 'vue'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import TryItAuth from './TryItAuth.vue'
import composables from '@/composables'

enableAutoUnmount(afterEach)

describe('<TryItAuth />', () => {

  beforeEach(() => {
    const { activeSecurityScheme, authHeadersMap, authQueryMap, authInputs } = composables.useAuth()
    activeSecurityScheme.value = ''
    authHeadersMap.value = {}
    authQueryMap.value = {}
    authInputs.value = {}
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('Should renderer basic auth', async () => {

    const wrapper = mount(TryItAuth, {
      props: {
        data: {
          id: '123',
          method: 'get',
          path: '/api-products/{apiProductId}/product-versions/{id}',
          responses: [],
          servers: [],
          security: [[{ 'id': 'b8d834b8fb9f5', 'key': 'basicAuth', 'extensions': {}, 'type': 'http', 'scheme': 'basic' }]],
        },
      },
      global: {
        provide: {
          'security-scheme-group-list': ref([{ 'title': 'basicAuth', 'key': 'basicAuth', 'schemeList': [{ 'id': 'b8d834b8fb9f5', 'key': 'basicAuth', 'extensions': {}, 'type': 'http', 'scheme': 'basic' }] }]),
        },
      },
    })
    expect(wrapper.html()).toContain('Username')
  })

  it('Should renderer auth2 clientCredentials', async () => {

    const wrapper = mount(TryItAuth, {
      props: {
        data: {
          id: '123',
          method: 'get',
          path: '/api-products/{apiProductId}/product-versions/{id}',
          responses: [],
          servers: [],
          security: [[
            {
              'id': 'eb4f15b6392da',
              'key': 'ClientCredentialAuth',
              'extensions': {},
              'description': 'OAuth2 client credentials flow',
              'type': 'oauth2',
              'flows': {
                'clientCredentials': {
                  'scopes': {
                    'read': 'Grants read access',
                    'write': 'Grants write access',
                  },
                  'tokenUrl': 'https://xy8c8zqt7hpjdhcp.us.identity.konghq.com/auth/oauth/token',
                },
              },
            },
          ]],
        },
      },
      global: {
        provide: {
          'security-scheme-group-list': ref([{
            'title': 'ClientCredentialAuth',
            'key': 'ClientCredentialAuth',
            'schemeList': [
              {
                'id': 'eb4f15b6392da',
                'key': 'ClientCredentialAuth',
                'extensions': {},
                'description': 'OAuth2 client credentials flow',
                'type': 'oauth2',
                'flows': {
                  'clientCredentials': {
                    'scopes': {
                      'read': 'Grants read access',
                      'write': 'Grants write access',
                    },
                    'tokenUrl': 'https://xy8c8zqt7hpjdhcp.us.identity.konghq.com/auth/oauth/token',
                  },
                },
              },
            ],
          }]),
        },
      },
    })
    expect(wrapper.html()).toContain('Scopes')
  })

  it('updates combined headers before OAuth token acquisition returns', async () => {
    vi.useFakeTimers()
    const security = [[
      {
        id: 'oauth', key: 'OAuth', extensions: {}, type: 'oauth2' as const,
        flows: { clientCredentials: { tokenUrl: 'https://example.test/token', scopes: {} } },
      },
      { id: 'api-key', key: 'ApiKey', extensions: {}, type: 'apiKey' as const, in: 'header' as const, name: 'apikey' },
    ]]
    const group = { title: 'OAuth & ApiKey', key: 'OAuth-ApiKey', schemeList: security[0] }
    const { activeSecurityScheme, authInputs, authHeadersMap } = composables.useAuth()
    activeSecurityScheme.value = group.key
    authInputs.value = { 'OAuth-clientId': 'client', 'OAuth-clientSecret': 'secret', 'ApiKey-token': 'key-value' }
    const tokenResponse = {
      ok: true,
      json: async () => ({ access_token: 'new-token', token_type: 'Bearer', expires_in: 60 }),
    }
    const fetchMock = vi.fn().mockResolvedValue(tokenResponse)
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(TryItAuth, {
      props: {
        data: { id: 'oauth-combined', method: 'post', path: '/example', responses: [], servers: [], security },
      },
      global: { provide: { 'security-scheme-group-list': ref([group]) } },
    })
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)

    expect(await wrapper.vm.auth2ClientCredentialsAuth()).toBe(tokenResponse)

    // The API request uses these headers immediately, before the debounce runs.
    expect(authHeadersMap.value[group.key]).toEqual([
      { name: 'Authorization', value: 'Bearer new-token' },
      { name: 'apikey', value: 'key-value' },
    ])
    await wrapper.vm.auth2ClientCredentialsAuth()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('combines headers for schemes in the same security requirement', async () => {
    const security = [[
      { id: 'bearer', key: 'BearerAuth', extensions: {}, type: 'http', scheme: 'bearer' },
      { id: 'api-key', key: 'ApiKeyAuth', extensions: {}, type: 'apiKey', in: 'header', name: 'apikey' },
    ]]
    const group = { title: 'BearerAuth & ApiKeyAuth', key: 'BearerAuth-ApiKeyAuth', schemeList: security[0] }
    const { activeSecurityScheme } = composables.useAuth()
    activeSecurityScheme.value = group.key
    const wrapper = mount(TryItAuth, {
      props: {
        data: { id: 'dual-auth', method: 'post', path: '/example', responses: [], servers: [], security },
      },
      global: { provide: { 'security-scheme-group-list': ref([group]) } },
    })

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('jwt-value')
    await inputs[1].setValue('api-key-value')
    await new Promise(resolve => setTimeout(resolve, 300))
    await flushPromises()

    const { authHeadersMap } = composables.useAuth()
    expect(authHeadersMap.value[group.key]).toEqual([
      { name: 'Authorization', value: 'Bearer jwt-value' },
      { name: 'apikey', value: 'api-key-value' },
    ])
  })

})
