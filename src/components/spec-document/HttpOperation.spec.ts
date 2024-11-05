import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HttpOperation from './HttpOperation.vue'
import type { IHttpOperation, IServer } from '@stoplight/types'
import composables from '@/composables'


describe('<HttpOperation />', () => {
  describe('TryIt section', () => {
    it('TryIt is shown for operation', () => {
      const wrapper = mount(HttpOperation, {
        props: {
          data: <IHttpOperation>{
            id: '123',
            path: '/sample-path',
            method: 'get',
            servers: <Array<IServer>>[{
              id: 'sample-server-id',
              url: 'https://stoplight.io/api',
              description: 'sample description',
            }],
          },
        },
      })
      expect(wrapper.findTestId('tryit-call-button-123').exists()).toBe(true)
    })

    it('TryIt is not rendered when hideTryIt is true', () => {
      const wrapper = mount(HttpOperation, {
        props: {
          data: <IHttpOperation>{
            id: '123',
            servers: <Array<IServer>>[{
              id: 'sample-server-id',
              url: 'https://stoplight.io/api',
              description: 'sample description',
            }],
          },
        },
        global: {
          provide: {
            'hide-tryit': ref(true),
          },
        },

      })
      expect(wrapper.findTestId('tryit-dropdown-123').exists()).toBe(false)
    })

    it('TryIt dropdown is not rendered when path is not provided', () => {
      const wrapper = mount(HttpOperation, {
        props: {
          data: <IHttpOperation>{
            id: '123',
            servers: <Array<IServer>>[{
              id: 'sample-server-id',
              url: 'https://stoplight.io/api',
              description: 'sample description',
            }],
          },
        },
      })
      expect(wrapper.findTestId('tryit-dropdown-123').exists()).toBe(false)
    })

    it('TryIt is not rendered when server list is not defined in the spec', () => {
      const wrapper = mount(HttpOperation, {
        props: {
          data: <IHttpOperation>{
            id: '123',
          },
        },
      })
      expect(wrapper.findTestId('tryit-dropdown-123').exists()).toBe(false)
    })
  })

  describe('ServerEndpoint', () => {
    it('renders when server list is defined in the spec', () => {
      const data = {
        id: '123',
        method: 'get',
        summary: 'sample endpoint name',
        path: '/sample-path',
        responses: [],
      }

      const { initialize } = composables.useServerList()
      initialize([{
        id: 'sample-server-id',
        url: 'https://global.api.konghq.com/v2',
      }])

      const wrapper = mount(HttpOperation, {
        props: {
          data,
        },
      })

      // server endpoint is rendered for the server URL
      expect(wrapper.findTestId(`server-endpoint-${data.id}`).exists()).toBe(true)
    })

    it('is not rendered when server list is not defined in the spec', () => {
      const data = {
        id: '123',
        method: 'get',
        path: '/sample-path',
        responses: [],
      }


      const { initialize } = composables.useServerList()
      initialize([])

      const wrapper = mount(HttpOperation, {
        props: {
          data,
        },
      })

      // server endpoint is not rendered
      expect(wrapper.findTestId(`server-endpoint-${data.id}`).exists()).toBe(false)
    })

    it('is not rendered when path is not defined in the spec', () => {
      const data = {
        id: '123',
        method: 'get',
        servers: [{
          id: 'sample-server-id',
          url: 'https://global.api.konghq.com/v2',
        }],
        path: '',
        responses: [],
      }

      const { initialize } = composables.useServerList()
      initialize([{
        id: 'sample-server-id',
        url: 'https://global.api.konghq.com/v2',
      }])

      const wrapper = mount(HttpOperation, {
        props: {
          data,
        },
      })

      // server endpoint is not rendered
      expect(wrapper.findTestId(`server-endpoint-${data.id}`).exists()).toBe(false)
    })
  })
})
