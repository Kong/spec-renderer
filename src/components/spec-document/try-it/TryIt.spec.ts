import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { ref } from 'vue'
import TryIt from './TryIt.vue'
import TryItResponse from './TryItResponse.vue'
import composables from '@/composables'

enableAutoUnmount(afterEach)

describe('<TryIt />', () => {
  vi.stubGlobal('open', vi.fn())

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    const { activeSecurityScheme, authInputs } = composables.useAuth()
    activeSecurityScheme.value = ''
    authInputs.value = {}
  })

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

  it('should send a FormData body with no explicit content-type header for multipart/form-data', async () => {
    const wrapper = mount(TryIt, {
      props: {
        data: {
          id: '123',
          method: 'post',
          path: '/upload',
          responses: [],
          request: {
            body: {
              id: 'bodyId',
              contents: [
                {
                  id: 'mediatypeId',
                  mediaType: 'multipart/form-data',
                },
              ],
            },
          },
          servers: [{
            id: 'sample-server-id',
            url: 'https://global.api.konghq.com/v2',
          }],
        },
        requestBody: {
          isMultipart: true,
          formFields: [
            { name: 'title', kind: 'text', required: true, value: 'my title' },
            { name: 'avatar', kind: 'file', required: false, files: [new File(['abc'], 'avatar.png', { type: 'image/png' })] },
          ],
        },
        serverUrl: 'https://global.api.konghq.com/v2',
      },
    })

    global.fetch = vi.fn()
    await wrapper.findTestId('tryit-call-button-123').trigger('click')

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, options] = (fetch as any).mock.calls[0]
    expect(url).toBe('https://global.api.konghq.com/v2/upload')
    expect(options.method).toBe('POST')
    // the browser must set Content-Type itself (with the multipart boundary)
    expect(options.headers['Content-Type']).toBeUndefined()
    expect(options.headers['content-type']).toBeUndefined()
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('title')).toBe('my title')
    expect((options.body.get('avatar') as File).name).toBe('avatar.png')
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

  it('renders the body section when a multipart/form-data request body is present', async () => {
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
              contents: [{ id: 'mediatypeId', mediaType: 'multipart/form-data' }],
            },
          },
          servers: [{
            id: 'sample-server-id',
            url: 'https://global.api.konghq.com/v2',
          }],
        },
        requestBody: { isMultipart: true, formFields: [{ name: 'title', kind: 'text' }] },
        serverUrl: 'https://global.api.konghq.com/v2',
      },
    })

    await flushPromises()

    expect(wrapper.findTestId('tryit-body-123').exists()).toBe(true)
  })

  // Regression: the auth step ran outside any try, so a throw left Send disabled with no error shown.
  it('re-enables Send and shows the error when the auth step throws', async () => {
    // freeze only the input debounce, which would hit the same throw on its own later
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const basic = { id: 'basic', key: 'Basic', extensions: {}, type: 'http' as const, scheme: 'basic' }
    const group = { title: 'Basic', key: 'Basic', schemeList: [basic] }
    const { activeSecurityScheme, authInputs } = composables.useAuth()
    activeSecurityScheme.value = group.key
    // btoa throws on characters outside Latin-1
    authInputs.value = { 'Basic-username': '名前', 'Basic-password': 'secret' }
    const wrapper = mount(TryIt, {
      props: {
        data: {
          id: '123',
          method: 'get',
          path: '/sample-path',
          responses: [],
          servers: [{ id: 'sample-server-id', url: 'https://global.api.konghq.com/v2' }],
          security: [[basic]],
        },
        serverUrl: 'https://global.api.konghq.com/v2',
      },
      global: { provide: { 'security-scheme-group-list': ref([group]) } },
    })
    global.fetch = vi.fn()

    await wrapper.findTestId('tryit-call-button-123').trigger('click')
    await flushPromises()

    expect(fetch).not.toHaveBeenCalled()
    expect(wrapper.findTestId('tryit-call-button-123').attributes('disabled')).toBeUndefined()
    expect(wrapper.findComponent(TryItResponse).props('responseError')).toBeInstanceOf(Error)
  })
})
