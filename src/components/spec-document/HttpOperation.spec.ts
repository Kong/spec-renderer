import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

window.HTMLElement.prototype.scrollIntoView = vi.fn()
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
            servers: <IServer[]>[{
              id: 'sample-server-id',
              url: 'https://localhost.io/api',
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
            servers: <IServer[]>[{
              id: 'sample-server-id',
              url: 'https://localhost.io/api',
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
            servers: <IServer[]>[{
              id: 'sample-server-id',
              url: 'https://localhost.io/api',
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

    it('is rendered even if server list is not defined in the spec but path is defined', () => {
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
      expect(wrapper.findTestId(`server-endpoint-${data.id}`).exists()).toBe(true)
      // method and path for endpoint are rendered
      expect(wrapper.findTestId(`server-endpoint-${data.id}`).text()).toBe(data.method + data.path)
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

  describe('permalink', () => {
    const operationData: IHttpOperation = {
      id: 'op1',
      path: '/foo',
      method: 'get',
      responses: [],
    }

    beforeEach(() => {
      // useClipboard({ legacy: true }) falls back to document.execCommand in jsdom
      document.execCommand = vi.fn().mockReturnValue(true)
      vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('does not render permalink button when permalinkUrl prop is not set', () => {
      const wrapper = mount(HttpOperation, { props: { data: operationData } })
      expect(wrapper.findTestId('operation-permalink-button').exists()).toBe(false)
    })

    it('renders permalink button when permalinkUrl prop is set', () => {
      const wrapper = mount(HttpOperation, {
        props: { data: operationData, permalinkUrl: '/base/operations/op1' },
      })
      expect(wrapper.findTestId('operation-permalink-button').exists()).toBe(true)
    })

    it('permalink button href matches permalinkUrl', () => {
      const wrapper = mount(HttpOperation, {
        props: { data: operationData, permalinkUrl: '/base/operations/op1' },
      })
      expect(wrapper.findTestId('operation-permalink-button').attributes('href')).toBe('/base/operations/op1')
    })

    it('calls window.history.pushState with permalinkUrl on click', async () => {
      const permalink = '/base/operations/op1'
      const wrapper = mount(HttpOperation, {
        props: { data: operationData, permalinkUrl: permalink },
      })
      await wrapper.findTestId('operation-permalink-button').trigger('click')
      await flushPromises()
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', permalink)
    })

    it('does not call pushState when current URL already matches permalinkUrl', async () => {
      // jsdom default: pathname='/', hash='' → currentUrl='/'
      const wrapper = mount(HttpOperation, {
        props: { data: operationData, permalinkUrl: '/' },
      })
      await wrapper.findTestId('operation-permalink-button').trigger('click')
      await flushPromises()
      expect(window.history.pushState).not.toHaveBeenCalled()
    })

    it('triggers clipboard copy on click', async () => {
      const wrapper = mount(HttpOperation, {
        props: { data: operationData, permalinkUrl: '/base/operations/op1' },
      })
      await wrapper.findTestId('operation-permalink-button').trigger('click')
      await flushPromises()
      // useClipboard falls back to document.execCommand('copy') in jsdom
      expect(document.execCommand).toHaveBeenCalledWith('copy')
    })

    it('shows "Copy link" title on permalink button', () => {
      const wrapper = mount(HttpOperation, {
        props: { data: operationData, permalinkUrl: '/base/operations/op1' },
      })
      expect(wrapper.findTestId('operation-permalink-button').attributes('title')).toBe('Copy link')
    })
  })
})
