import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BodyContentList from './BodyContentList.vue'

describe('<BodyContentList />', () => {
  it('renders', () => {
    const wrapper = mount(BodyContentList, {
      props: {
        contents: [
          {
            id: 'a1e3r4',
            mediaType: 'application/json',
            // schema without a title
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          },
          {
            id: 'by5q6up',
            mediaType: 'application/json',
            schema: {
              // schema with a title
              title: 'Person',
              type: 'object',
              properties: {
                fullName: {
                  type: 'string',
                },
              },
            },
          },
        ],
      },
    })

    // the component itself is rendered
    expect(wrapper.findTestId('endpoint-body-content-list').exists()).toBe(true)

    // ——— the model node component renders for both request body content items ———
    // schema with title
    expect(wrapper.findTestId('model-node-Person').exists()).toBe(true)
    // schema without title, so generic title is used for rendering ModelNode
    expect(wrapper.findTestId('model-node-Request-Body-Schema-Model').exists()).toBe(true)
  })
})
