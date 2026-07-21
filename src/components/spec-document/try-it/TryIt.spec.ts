import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import TryIt from './TryIt.vue'


describe('<TryIt />', () => {
  vi.stubGlobal('open', vi.fn())
  it('should call fetch with correct url, headers and body for POST', async () => {
    const wrapper = mount(TryIt, {
      props: {
        data: {
          id: '123',
          method: 'post',
          path: '/sample-path',
          responses: [],
          servers: [{
            id: 'sample-server-id',
            url: 'https://global.api.konghq.com/v2',
          }],
        },
        requestBody: { content: '{"a": "1", "b": "2"}' },
        serverUrl: 'https://global.api.konghq.com/v2',
      },
    })

    expect(wrapper.findTestId('tryit-dropdown-123').exists()).toBe(false)

    global.fetch = vi.fn()
    await wrapper.findTestId('tryit-call-button-123').trigger('click')
    expect(fetch).toHaveBeenCalledWith('https://global.api.konghq.com/v2/sample-path', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      cache: 'no-cache',
      body: '{"a": "1", "b": "2"}',
    })
  })

  it('should format body for form-urlencoded content-type [TDX-5963]', async () => {
    const wrapper = mount(TryIt, {
      props: {
        data: {
          id: '123',
          method: 'post',
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
        requestBody: { content: '{"a": "1", "b": "2"}' },
        serverUrl: 'https://global.api.konghq.com/v2',
      },
    })

    expect(wrapper.findTestId('tryit-dropdown-123').exists()).toBe(false)

    global.fetch = vi.fn()
    await wrapper.findTestId('tryit-call-button-123').trigger('click')
    expect(fetch).toHaveBeenCalledWith('https://global.api.konghq.com/v2/sample-path', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      cache: 'no-cache',
      method: 'POST',
      body: 'a=1&b=2',
    })
  })

  it('should call fetch with correct url and headers for GET', async () => {
    const wrapper = mount(TryIt, {
      props: {
        data: {
          id: '123',
          method: 'GET',
          path: '/sample-path',
          responses: [],
          servers: [{
            id: 'sample-server-id',
            url: 'https://global.api.konghq.com/v2',
          }],
        },
        serverUrl: 'https://global.api.konghq.com/v2',
      },
    })

    expect(wrapper.findTestId('tryit-dropdown-123').exists()).toBe(false)

    global.fetch = vi.fn()
    await wrapper.findTestId('tryit-call-button-123').trigger('click')
    // get request - first time needs to be called with content-type header deleted
    expect(fetch).toHaveBeenCalledWith('https://global.api.konghq.com/v2/sample-path', {
      headers: {
      },
      cache: 'no-cache',
      method: 'GET',
    })
  })

  it('should provide dropdown for tryIt options', async () => {
    const wrapper = mount(TryIt, {
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
      },
      global: {
        provide: {
          'spec-url': ref('/http://lcalhost/xxx'),
        },
      },
      attachTo: document.body, // required for any interaction with the DOM to work
    })
    const spy = vi.spyOn(window, 'open')

    // open dropdown so inosomnia option is visible
    await wrapper.findTestId('trigger-button').trigger('click')
    // select inosomnia option
    await wrapper.findTestId('tryit-insomnia-123').trigger('click')
    expect(spy).toBeCalledWith(`https://insomnia.rest/run?uri=${encodeURIComponent('/http://lcalhost/xxx')}`, '_blank')
  })

  it('should renderer file selector for binary body', async () => {
    const wrapper = mount(TryIt, {
      props: {
        data: {
          id: '123',
          method: 'post',
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
        requestBody: { isBinary: true, content: [{ name: 'test file.pdf' } as unknown as File] },
        serverUrl: 'https://global.api.konghq.com/v2',
      },
    })
    await flushPromises()
    const code = wrapper.html()
    expect(code).toMatch('Choose file')
  })

  it('should render component with insomnia option when hideTryIt is set to true', async () => {
    const wrapper = mount(TryIt, {
      props: {
        data: {
          id: '123',
          method: 'post',
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
        requestBody: { isBinary: true, content: [{ name: 'test file.pdf' } as unknown as File] },
        serverUrl: 'https://global.api.konghq.com/v2',
      },
      global: {
        provide: {
          ['hide-tryit']: ref(true),
        },
      },
    })

    await flushPromises()

    const component = wrapper.findTestId('tryit-wrapper-123')

    expect(component.exists()).toBe(true)
  })

  it('should render component with browser option when hideInsomniaTryIt is set to true', async () => {
    const wrapper = mount(TryIt, {
      props: {
        data: {
          id: '123',
          method: 'post',
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
        requestBody: { isBinary: true, content: [{ name: 'test file.pdf' } as unknown as File] },
        serverUrl: 'https://global.api.konghq.com/v2',
      },
      global: {
        provide: {
          ['hide-tryit']: ref(false),
          ['hide-insomnia-tryit']: ref(true),
        },
      },
    })

    await flushPromises()

    const component = wrapper.findTestId('tryit-wrapper-123')

    expect(component.exists()).toBe(true)
  })

  it('hides the body section for an operation with no params, auth, body, or response', async () => {
    const wrapper = mount(TryIt, {
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
      },
    })

    await flushPromises()

    // wrapper renders, but the body is collapsed since there is nothing to show
    expect(wrapper.findTestId('tryit-wrapper-123').exists()).toBe(true)
    expect(wrapper.findTestId('tryit-body-123').exists()).toBe(false)
  })

  it('renders the body section when a request body sample is present', async () => {
    const wrapper = mount(TryIt, {
      props: {
        data: {
          id: '123',
          method: 'post',
          path: '/sample-path',
          responses: [],
          request: {
            body: {
              id: 'bodyId',
              contents: [{ id: 'mediatypeId', mediaType: 'application/json' }],
            },
          },
          servers: [{
            id: 'sample-server-id',
            url: 'https://global.api.konghq.com/v2',
          }],
        },
        requestBody: { isBinary: false, content: '{"a": "1"}' },
        serverUrl: 'https://global.api.konghq.com/v2',
      },
    })

    await flushPromises()

    expect(wrapper.findTestId('tryit-body-123').exists()).toBe(true)
  })
})
