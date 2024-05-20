import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HttpResponse from './HttpResponse.vue'

describe('<HttpResponse />', () => {
  it('renders', () => {
    const wrapper = mount(HttpResponse, {
      props: {
        response: {
          code: '200',
          id: 'sample-response',
          contents: [
            {
              id: 'a1e3r4',
              mediaType: 'application/json',
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                },
              },
            },
          ],
        },
      },
    })

    // verify the component itself is rendered
    expect(wrapper.findTestId('endpoint-http-response').exists()).toBe(true)
    // verify the Content List component is rendered for valid response contents array
    expect(wrapper.findTestId('endpoint-body-content-list').exists()).toBe(true)
  })
})
