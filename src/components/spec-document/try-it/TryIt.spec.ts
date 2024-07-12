import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import TryIt from './TryIt.vue'


describe('<TryIt />', () => {
  vi.stubGlobal('open', vi.fn())
  it('KHCP-12161 - should call fetch with correct url', async () => {
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

    expect(wrapper.findTestId('tryit-dropdown-123').exists()).toBe(false)

    global.fetch = vi.fn()
    await wrapper.findTestId('tryit-call-button-123').trigger('click')
    expect(fetch).toHaveBeenCalledWith(new URL('https://global.api.konghq.com/v2/sample-path'), {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'get',
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

    })
    const spy = vi.spyOn(window, 'open')
    expect(wrapper.findTestId('tryit-dropdown-123').exists()).toBe(true)
    await wrapper.findTestId('tryit-dropdown-123').trigger('click')
    await wrapper.findTestId('tryit-insomnia-123').trigger('click')
    expect(spy).toBeCalledWith(`https://insomnia.rest/run?uri=${encodeURIComponent('/http://lcalhost/xxx')}`, '_blank')
  })
})
