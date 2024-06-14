import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TryIt from './TryIt.vue'


describe('<TryIt />', () => {
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
    global.fetch = vi.fn()
    await wrapper.findTestId('tryit-btn-123').trigger('click')
    expect(fetch).toHaveBeenCalledWith(new URL('https://global.api.konghq.com/v2/sample-path'), {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'get',
    })
  })
})
