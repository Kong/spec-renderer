import { ref } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HttpOperation from './HttpOperation.vue'
import type { IHttpOperation, IServer } from '@stoplight/types'

describe('<HttpOperation />', () => {
  describe('TryIt section', () => {

    it('TryIt is shown for operation', () => {
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
      expect(wrapper.findTestId('tryit-btn-123').exists()).toBe(true)
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
      expect(wrapper.findTestId('tryit-btn-123').exists()).toBe(false)
    })

    it('TryIt is not rendered when server list is not defined in the spec', () => {
      const wrapper = mount(HttpOperation, {
        props: {
          data: <IHttpOperation>{
            id: '123',
          },
        },
      })
      expect(wrapper.findTestId('tryit-btn-123').exists()).toBe(false)
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

  describe('TryIt', () => {
    it('KHCP-12161 - should call fetch with correct url', async () => {
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
      global.fetch = vi.fn()
      await wrapper.findTestId('tryit-btn-123').trigger('click')
      expect(fetch).toHaveBeenCalledWith('https://global.api.konghq.com/v2/sample-path', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'get',
      })
    })
  })

})
