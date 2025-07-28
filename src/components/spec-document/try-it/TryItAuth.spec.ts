import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TryItAuth from './TryItAuth.vue'


describe('<TryItAuth />', () => {

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
})
