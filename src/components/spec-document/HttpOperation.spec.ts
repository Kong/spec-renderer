import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

window.HTMLElement.prototype.scrollIntoView = vi.fn()
import HttpOperation from './HttpOperation.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
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

  describe('operation-level server blocks', () => {
    const { initialize, selectedServerUrl } = composables.useServerList()

    beforeEach(() => {
      initialize(<IServer[]>[{
        id: 'global-server-id',
        url: 'https://api.example.com/v1',
      }])
    })

    it('renders the operation scoped server url when the operation has its own servers block', () => {
      const data = {
        id: '123',
        method: 'post',
        path: '/files',
        responses: [],
        servers: <IServer[]>[{
          id: 'uploads-server-id',
          url: 'https://uploads.example.com',
        }],
      }

      const wrapper = mount(HttpOperation, {
        props: {
          data,
        },
      })

      // the operation's own scoped server url is rendered, not the global one
      expect(wrapper.findTestId('server-url-post-https://uploads.example.com/files').exists()).toBe(true)
      expect(wrapper.findTestId('server-endpoint-123').text()).not.toContain('https://api.example.com/v1')
    })

    it('renders the global server url when the operation does not have scoped servers', () => {
      const data = {
        id: '123',
        method: 'get',
        path: '/users',
        responses: [],
        servers: <IServer[]>[{
          id: 'global-server-id',
          url: 'https://api.example.com/v1',
        }],
      }

      const wrapper = mount(HttpOperation, {
        props: {
          data,
        },
      })

      expect(wrapper.findTestId('server-url-get-https://api.example.com/v1/users').exists()).toBe(true)
    })

    it('offers custom server urls on operations with scoped servers', async () => {
      initialize(<IServer[]>[{
        id: 'global-server-id',
        url: 'https://api.example.com/v1',
      }])
      const { addServerUrl } = composables.useServerList()
      addServerUrl('https://proxy.example.com')

      const data = {
        id: '123',
        method: 'get',
        path: '/reports',
        responses: [],
        servers: <IServer[]>[{
          id: 'analytics-server-id',
          url: 'https://analytics.example.com',
        }],
      }

      const wrapper = mount(HttpOperation, {
        props: {
          data,
        },
      })

      // the scoped server and the custom url are both offered
      const items = wrapper.findComponent(SelectDropdown).props('items') as Array<{ label: string }>
      expect(items.map(item => item.label)).toEqual(['https://analytics.example.com', 'https://proxy.example.com'])
      // the globally selected custom url is displayed on the scoped operation
      expect(wrapper.findTestId('server-endpoint-123').text()).toContain('https://proxy.example.com')
    })

    it('does not sync a scoped server selection with the global server selection', async () => {
      const data = {
        id: '123',
        method: 'get',
        path: '/reports',
        responses: [],
        servers: <IServer[]>[{
          id: 'analytics-server-id',
          url: 'https://analytics.example.com',
        }, {
          id: 'analytics-eu-server-id',
          url: 'https://analytics-eu.example.com',
        }],
      }

      const wrapper = mount(HttpOperation, {
        props: {
          data,
        },
      })

      // scoped server selection happens through the server dropdown
      wrapper.findComponent(SelectDropdown).vm.$emit('update:modelValue', 'https://analytics-eu.example.com')
      await flushPromises()

      expect(wrapper.findTestId('server-endpoint-123').text()).toContain('https://analytics-eu.example.com')
      // the global server selection is left untouched
      expect(selectedServerUrl.value).toBe('https://api.example.com/v1')
    })

    it('syncs a global server selection across operations', async () => {
      initialize(<IServer[]>[{
        id: 'global-server-id',
        url: 'https://api.example.com/v1',
      }, {
        id: 'global-eu-server-id',
        url: 'https://api-eu.example.com/v1',
      }])

      const operation1 = mount(HttpOperation, {
        props: {
          data: {
            id: '123',
            method: 'get',
            path: '/users',
            responses: [],
          },
        },
      })
      const operation2 = mount(HttpOperation, {
        props: {
          data: {
            id: '456',
            method: 'get',
            path: '/reports',
            responses: [],
          },
        },
      })

      operation1.findComponent(SelectDropdown).vm.$emit('update:modelValue', 'https://api-eu.example.com/v1')
      await flushPromises()

      expect(operation1.findTestId('server-endpoint-123').text()).toContain('https://api-eu.example.com/v1')
      expect(operation2.findTestId('server-endpoint-456').text()).toContain('https://api-eu.example.com/v1')
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
