import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
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
        requestBody: '{"a": "1", "b": "2"}',
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
        requestBody: '{"a": "1", "b": "2"}',
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
})
