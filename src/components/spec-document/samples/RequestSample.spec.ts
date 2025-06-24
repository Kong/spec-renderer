import { describe, it, expect, vi , beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RequestSample from './RequestSample.vue'
import composables from '@/composables'


describe('<RequestSample />', () => {
  beforeEach(() => {
    //@ts-ignore we only need to spyOn one specific method
    vi.spyOn(composables, 'useShiki').mockImplementation(() => {
      return {
        highlighter: {
          value: {
            codeToHtml: (s)=> (s),
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
        requestBody: '{"a": "1", "b": "2"}',
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
        requestBody: '{"a": "1", "b": "2"}',
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
        serverUrl: 'global.api.konghq.com/v2',
        requestPath: '/path',
      },
    })
    await flushPromises()
    const code = wrapper.findTestId('request-sample-123').html()
    expect(code).toMatch('--url http://global.api.konghq.com/v2/path')
  })

})
