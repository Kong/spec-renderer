import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HttpOperation from './HttpOperation.vue'
import type { IHttpOperation, IHttpService, IServer } from '@stoplight/types'

describe('<HttpOperation />', () => {
  describe('TryIt section', () => {

    it('TryIt is shown for operation', () => {
      const wrapper = mount(HttpOperation, {
        props: {
          data: <IHttpOperation>{
            id: '123',
          },
          overviewData: <IHttpService>{
            servers: <Array<IServer>>[{
              id: 'sample-server-id',
              url: 'https://stoplight.io/api',
              description: 'sample description',
            }],
          },
        },
      })
      expect(wrapper.findTestId('tryit-123').exists()).toBe(true)
    })

    it('TryIt is not rendered when hideTryIt is true', () => {
      const wrapper = mount(HttpOperation, {
        props: {
          data: <IHttpOperation>{
            id: '123',
          },
          overviewData: <IHttpService>{
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
      expect(wrapper.findTestId('tryit-123').exists()).toBe(false)
    })

    it('TryIt is not rendered when server list is not defined in the spec', () => {
      const wrapper = mount(HttpOperation, {
        props: {
          data: <IHttpOperation>{
            id: '123',
          },
          overviewData: <IHttpService>{
          },
        },
      })
      expect(wrapper.findTestId('tryit-123').exists()).toBe(false)
    })
  })

  describe('ServerEndpoint', () => {
    it('renders when server list is defined in the spec', () => {
      const wrapper = mount(HttpOperation, {
        props: {
          data: {
            id: '123',
            method: 'get',
            path: '/sample-path',
            responses: [],
            servers: [{
              id: 'sample-server-id',
              url: 'https://global.api.konghq.com/v2',
            }],
          },
        },
      })
      expect(wrapper.findTestId('server-endpoint').exists()).toBe(true)
    })

    it('is not rendered when server list is not defined in the spec', () => {
      const wrapper = mount(HttpOperation, {
        props: {
          data: {
            id: '123',
            method: 'get',
            path: '/sample-path',
            responses: [],
          },
        },
      })
      expect(wrapper.findTestId('server-endpoint').exists()).toBe(false)
    })
  })
})
