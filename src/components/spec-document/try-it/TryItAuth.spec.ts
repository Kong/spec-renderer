import { ref } from 'vue'
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TryItAuth from './TryItAuth.vue'
import composables from '@/composables'


describe('<TryItAuth />', () => {

  beforeEach(() => {
    const { activeSecurityScheme, authHeadersMap, authQueryMap, authInputs } = composables.useAuth()
    activeSecurityScheme.value = ''
    authHeadersMap.value = {}
    authQueryMap.value = {}
    authInputs.value = {}
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
