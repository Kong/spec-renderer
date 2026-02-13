import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HttpOperation from './HttpOperation.vue'
import HttpOperationBody from './endpoint/HttpOperationBody.vue'
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

  describe('Property Links', () => {
    const operationData: IHttpOperation = {
      id: '123',
      method: 'get',
      path: '/pets',
      responses: [{
        id: 'res-200',
        code: '200',
        contents: [{
          id: 'content-1',
          mediaType: 'application/json',
          schema: { type: 'object', properties: { name: { type: 'string' } } },
        }],
      }],
      request: {
        body: {
          id: 'body-1',
          contents: [{
            id: 'content-2',
            mediaType: 'application/json',
            schema: { type: 'object', properties: { email: { type: 'string' } } },
          }],
        },
      },
    }

    it('passes basePathId to HttpOperationBody when enable-property-links is true', () => {
      const wrapper = mount(HttpOperation, {
        props: { data: operationData },
        global: {
          provide: {
            'enable-property-links': ref(true),
          },
        },
      })

      const bodies = wrapper.findAllComponents(HttpOperationBody)
      const requestBody = bodies.find(b => b.classes().includes('http-operation-request-body'))
      const responseBody = bodies.find(b => b.classes().includes('http-operation-response'))

      expect(requestBody?.props('basePathId')).toBe('get-pets-request-body')
      expect(responseBody?.props('basePathId')).toBe('get-pets-response-200')
    })

    it('does not pass basePathId when enable-property-links is not provided', () => {
      const wrapper = mount(HttpOperation, {
        props: { data: operationData },
      })

      const bodies = wrapper.findAllComponents(HttpOperationBody)
      bodies.forEach(body => {
        expect(body.props('basePathId')).toBe('')
      })
    })
  })
})
