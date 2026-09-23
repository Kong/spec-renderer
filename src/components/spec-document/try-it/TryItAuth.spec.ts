import { ref, nextTick } from 'vue'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import TryItAuth from './TryItAuth.vue'
import TryIt from './TryIt.vue'
import RequestSample from '../samples/RequestSample.vue'
import CodeBlock from '@/components/common/CodeBlock.vue'
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

    expect((await wrapper.vm.runPreRequestAuth()).ok).toBe(true)

    // The API request uses these headers immediately, before the debounce runs.
    expect(authHeadersMap.value[group.key]).toEqual([
      { name: 'Authorization', value: 'Bearer new-token' },
      { name: 'apikey', value: 'key-value' },
    ])
    await wrapper.vm.runPreRequestAuth()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('combines headers for schemes in the same security requirement', async () => {
    vi.useFakeTimers()
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
    await vi.advanceTimersByTimeAsync(100)
    await flushPromises()

    const { authHeadersMap } = composables.useAuth()
    expect(authHeadersMap.value[group.key]).toEqual([
      { name: 'Authorization', value: 'Bearer jwt-value' },
      { name: 'apikey', value: 'api-key-value' },
    ])
  })

  it('omits empty credentials and removes cleared API keys from a combined requirement', async () => {
    vi.useFakeTimers()
    const schemeList = [
      { id: 'bearer', key: 'Bearer', extensions: {}, type: 'http', scheme: 'bearer' },
      { id: 'key', key: 'Key', extensions: {}, type: 'apiKey', in: 'header', name: 'apikey' },
      { id: 'query', key: 'Query', extensions: {}, type: 'apiKey', in: 'query', name: 'api_key' },
      { id: 'basic', key: 'Basic', extensions: {}, type: 'http', scheme: 'basic' },
      { id: 'oauth', key: 'OAuth', extensions: {}, type: 'oauth2', flows: { clientCredentials: { tokenUrl: 'https://example.test/token', scopes: {} } } },
    ]
    const group = { title: 'Combined', key: 'combined', schemeList }
    const { activeSecurityScheme, authInputs, authHeadersMap, authQueryMap } = composables.useAuth()
    activeSecurityScheme.value = group.key
    mount(TryItAuth, {
      props: { data: { id: 'empty-auth', method: 'get', path: '/example', responses: [], servers: [], security: [schemeList] } },
      global: { provide: { 'security-scheme-group-list': ref([group]) } },
    })
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    authInputs.value = { 'Bearer-token': '', 'Key-token': '', 'Basic-username': '', 'Basic-password': '' }
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    expect(authHeadersMap.value[group.key]).toEqual([])
    expect(authQueryMap.value[group.key]).toBe('')

    authInputs.value = { 'Bearer-token': 'token', 'Key-token': '0', 'Query-token': 'query-key' }
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    expect(authHeadersMap.value[group.key]).toEqual([
      { name: 'Authorization', value: 'Bearer token' },
      { name: 'apikey', value: '0' },
    ])
    expect(authQueryMap.value[group.key]).toBe('api_key=query-key')

    authInputs.value = { 'Bearer-token': 'token', 'Key-token': '', 'Query-token': '' }
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    expect(authHeadersMap.value[group.key]).toEqual([{ name: 'Authorization', value: 'Bearer token' }])
    expect(authQueryMap.value[group.key]).toBe('')

    // Both consumers receive the same filtered authentication headers.
    const data = { id: 'filtered-auth', method: 'get' as const, path: '/example', responses: [], servers: [] }
    const props = { data, serverUrl: 'https://example.test', authHeaders: authHeadersMap.value[group.key] }
    const request = mount(TryIt, { props })
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await request.findTestId('tryit-call-button-filtered-auth').trigger('click')
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ authorization: 'Bearer token' })
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('apikey')

    const sample = mount(RequestSample, { props: { ...props, requestPath: '/example' } })
    await flushPromises()
    const code = sample.getComponent(CodeBlock).props('code')
    expect(code).toContain('Bearer token')
    expect(code).not.toContain('apikey')

    authInputs.value = { 'Bearer-token': '   ', 'Key-token': '   ', 'Basic-username': 'user' }
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    expect(authHeadersMap.value[group.key]).toEqual([{ name: 'Authorization', value: `Basic ${btoa('user:')}` }])
  })

  it('returns the failed token response so TryIt can show it', async () => {
    const oauth = {
      id: 'oauth', key: 'OAuth2', extensions: {}, type: 'oauth2' as const,
      flows: { clientCredentials: { tokenUrl: 'https://example.test/token', scopes: {} } },
    }
    const group = { title: 'OAuth2', key: 'OAuth2', schemeList: [oauth] }
    const { activeSecurityScheme, authInputs } = composables.useAuth()
    activeSecurityScheme.value = group.key
    authInputs.value = { 'OAuth2-clientId': 'client', 'OAuth2-clientSecret': 'wrong' }
    const tokenResponse = { ok: false, status: 401, statusText: 'Unauthorized' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tokenResponse))
    const wrapper = mount(TryItAuth, {
      props: { data: { id: 'oauth-fail', method: 'get', path: '/example', responses: [], servers: [], security: [[oauth]] } },
      global: { provide: { 'security-scheme-group-list': ref([group]) } },
    })
    await nextTick()

    const result = await wrapper.vm.runPreRequestAuth()

    expect(result.ok).toBe(false)
    expect(result.response).toBe(tokenResponse)
  })

  // Regression: one endpoint going away used to remove the token step for every endpoint on that scheme.
  it('still fetches the token after another endpoint with the same scheme unmounts', async () => {
    const oauth = {
      id: 'oauth', key: 'OAuth2', extensions: {}, type: 'oauth2' as const,
      flows: { clientCredentials: { tokenUrl: 'https://example.test/token', scopes: {} } },
    }
    const group = { title: 'OAuth2', key: 'OAuth2', schemeList: [oauth] }
    const { activeSecurityScheme, authInputs } = composables.useAuth()
    activeSecurityScheme.value = group.key
    authInputs.value = { 'OAuth2-clientId': 'client', 'OAuth2-clientSecret': 'secret' }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: 'token' }) })
    vi.stubGlobal('fetch', fetchMock)
    const mountEndpoint = (id: string) => mount(TryItAuth, {
      props: { data: { id, method: 'get', path: `/${id}`, responses: [], servers: [], security: [[oauth]] } },
      global: { provide: { 'security-scheme-group-list': ref([group]) } },
    })

    const first = mountEndpoint('first')
    const second = mountEndpoint('second')
    await nextTick()
    first.unmount()

    await second.vm.runPreRequestAuth()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

})
