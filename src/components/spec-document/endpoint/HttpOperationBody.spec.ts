import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HttpOperationBody from './HttpOperationBody.vue'

describe('<HttpOperationBody />', () => {
  it('renders', () => {
    const wrapper = mount(HttpOperationBody, {
      props: {
        description: 'sample description',
        contentList: [
          {
            id: 'a1e3r4',
            mediaType: 'application/json',
            schema: {
              title: 'sample-model',
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
    })

    // verify the component itself is rendered
    expect(wrapper.findTestId('endpoint-http-response').exists()).toBe(true)
    // verify the Content List component is rendered for valid response contents array
    expect(wrapper.findTestId('endpoint-body-content-list').exists()).toBe(true)
    // verify the model node component is rendered for valid response contents array
    expect(wrapper.findTestId('model-node-sample-model').exists()).toBe(true)
  })
})
