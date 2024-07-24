import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RequestSample from './RequestSample.vue'
import composables from '@/composables'
import type { HighlighterCore } from 'shiki/core'


describe('<RequestSample />', () => {
  it('Should use correct url in the request sample', async () => {
    vi.spyOn(composables, 'useShiki').mockImplementation(() => {
      return {
        createHighlighter: (): Promise<HighlighterCore> => {
          return {
            //@ts-ignore irrelavent for mocking purposes
            codeToHtml: (c: string) => (c),
          }
        },
      }
      // whatever suites you from first two examples
    })
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
    const code = wrapper.findTestId('request-sample-123')
    expect(code.html()).toMatch('https://global.api.konghq.com/v2')
  })
})
