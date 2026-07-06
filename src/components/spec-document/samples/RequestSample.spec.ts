import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { IHttpOperation } from '@stoplight/types'
import RequestSample from './RequestSample.vue'
import VisibilityToggleButton from '@/components/common/VisibilityToggleButton.vue'
import composables from '@/composables'


describe('<RequestSample />', () => {
  beforeEach(() => {
    //@ts-ignore we only need to spyOn one specific method
    vi.spyOn(composables, 'useShiki').mockImplementation(() => {
      return {
        highlighter: {
          value: {
            codeToHtml: (s) => (s),
          },
        },
      }
      // whatever suites you from first two examples
    })

  })
  it('Should use correct url in the request sample', async () => {

    const wrapper = mount(RequestSample, {
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
        serverUrl: 'https://global.api.konghq.com/v2',
        requestPath: '/path',
      },
    })
    await flushPromises()
    const code = wrapper.findTestId('request-sample-123').html()
    expect(code).toMatch('https://global.api.konghq.com/v2/path')
  })

  it('Should format querystring and body [TDX-5963]', async () => {
    const wrapper = mount(RequestSample, {
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
        serverUrl: 'https://global.api.konghq.com/v2',
        requestPath: '/path',
        requestQuery: 'page=1&size=20',
        requestBody: { content: '{"a": "1", "b": "2"}' },
      },
    })
    await flushPromises()
    const code = wrapper.findTestId('request-sample-123').html()
    expect(code).toMatch('?page=1&amp;size=20')
    expect(code).toMatch('--data \'{"a": "1", "b": "2"}\'')
  })

  it('should format body for form-urlencoded content-type [TDX-5963]', async () => {

    const wrapper = mount(RequestSample, {
      props: {
        data: {
          id: '123',
          method: 'get',
          path: '/sample-path',
          responses: [],
          request: {
            body: {
              id: 'bodyId',
              contents: [
                {
                  id: 'mediatypeId',
                  mediaType: 'application/x-www-form-urlencoded',
                },
              ],
            },
          },
          servers: [{
            id: 'sample-server-id',
            url: 'https://global.api.konghq.com/v2',
          }],
        },
        serverUrl: 'https://global.api.konghq.com/v2',
        requestPath: '/path',
        requestBody: { content: '{"a": "1", "b": "2"}' },
      },
    })
    await flushPromises()
    const code = wrapper.findTestId('request-sample-123').html()
    expect(code).toMatch('--data \'a=1&amp;b=2\'')
  })


  it('should use correct URL when protocol is not specified [TDX-5963]', async () => {

    const wrapper = mount(RequestSample, {
      props: {
        data: {
          id: '123',
          method: 'get',
          path: '/sample-path',
          responses: [],
          servers: [{
            id: 'sample-server-id',
            url: 'global.api.konghq.com/v2',
          }],
        },
        serverUrl: 'global.api.konghq.com:3000/v2',
        requestPath: '/path',
      },
    })
    await flushPromises()
    const code = wrapper.findTestId('request-sample-123').html()
    expect(code).toMatch('--url global.api.konghq.com:3000/v2/path')
  })

  it('should use correct URL when url is specified as {protocol}://{hostname}/api/v3 [TDX-5963]', async () => {

    const wrapper = mount(RequestSample, {
      props: {
        data: {
          id: '123',
          method: 'get',
          path: '/sample-path',
          responses: [],
          servers: [{
            id: 'sample-server-id',
            url: 'global.api.konghq.com/v2',
          }],
        },
        serverUrl: '{protocol}://{hostname}/api/v3',
        requestPath: '/path',
      },
    })
    await flushPromises()
    const code = wrapper.findTestId('request-sample-123').html()
    expect(code).toMatch('--url protocol://hostname/api/v3')
  })

  it('should renderer error when URL is invalid', async () => {

    const wrapper = mount(RequestSample, {
      props: {
        data: {
          id: '123',
          method: 'get',
          path: '/sample-path',
          responses: [],
          servers: [{
            id: 'sample-server-id',
            url: 'global.api.konghq.com/v2',
          }],
        },
        serverUrl: '{hostname}/api/v3',
        requestPath: '/path',
      },
    })
    await flushPromises()
    const code = wrapper.findTestId('request-sample-123').html()
    expect(code).toContain("Invalid URL value 'hostname/api/v3/path'<br> - missing protocol")
  })

  describe('content-type based masking', () => {
    const baseData = <IHttpOperation>{
      id: '123',
      method: 'post',
      path: '/sample-path',
      responses: [],
      servers: [{ id: 'server-id', url: 'https://api.example.com' }],
      request: {
        body: {
          id: 'bodyId',
          contents: [
            {
              id: 'content-json',
              mediaType: 'application/json',
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string', 'x-sensitive-data': { mask: 'redact' } },
                },
              },
            },
            {
              id: 'content-xml',
              mediaType: 'application/xml',
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string', 'x-sensitive-data': { mask: 'redact' } },
                  name: { type: 'string' },
                },
              },
            },
            {
              id: 'content-plain',
              mediaType: 'text/plain',
              schema: { type: 'string' },
            },
          ],
        },
      },
    }

    const baseProps = {
      serverUrl: 'https://api.example.com',
      requestPath: '/sample-path',
      maskRules: [],
    }

    it('shows VisibilityToggleButton when contentType has sensitive fields', async () => {
      const wrapper = mount(RequestSample, {
        props: { ...baseProps, data: baseData, contentType: 'application/json' },
      })
      await flushPromises()
      expect(wrapper.findComponent(VisibilityToggleButton).exists()).toBe(true)
    })

    it('shows VisibilityToggleButton for second content type with sensitive fields', async () => {
      const wrapper = mount(RequestSample, {
        props: { ...baseProps, data: baseData, contentType: 'application/xml' },
      })
      await flushPromises()
      expect(wrapper.findComponent(VisibilityToggleButton).exists()).toBe(true)
    })

    it('hides VisibilityToggleButton when active contentType has no sensitive fields', async () => {
      const wrapper = mount(RequestSample, {
        props: { ...baseProps, data: baseData, contentType: 'text/plain' },
      })
      await flushPromises()
      expect(wrapper.findComponent(VisibilityToggleButton).exists()).toBe(false)
    })

    it('falls back to contents[0] schema when contentType is empty', async () => {
      const wrapper = mount(RequestSample, {
        props: { ...baseProps, data: baseData, contentType: '' },
      })
      await flushPromises()
      // contents[0] is application/json which has a sensitive field
      expect(wrapper.findComponent(VisibilityToggleButton).exists()).toBe(true)
    })

    it('falls back to contents[0] schema when contentType is unknown', async () => {
      const wrapper = mount(RequestSample, {
        props: { ...baseProps, data: baseData, contentType: 'application/unknown' },
      })
      await flushPromises()
      expect(wrapper.findComponent(VisibilityToggleButton).exists()).toBe(true)
    })
  })

})
