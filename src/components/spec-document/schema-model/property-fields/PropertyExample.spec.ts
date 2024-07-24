import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PropertyExample from './PropertyExample.vue'

const example = 'sample example string'

describe('<PropertyExample />', () => {
  it('renders string examples', () => {
    const wrapper = shallowMount(PropertyExample, {
      props: {
        example,
      },
    })

    expect(wrapper.findTestId('property-field-example').exists()).toBe(true)
    expect(wrapper.text()).toEqual(`Example:${example}`)
  })
  it('renders array examples', () => {
    const wrapper = shallowMount(PropertyExample, {
      props: {
        example: ['sample example', 'another example', { name: 'sample example' }],
      },
    })

    expect(wrapper.findTestId('property-field-example').exists()).toBe(true)
    expect(wrapper.text()).toEqual('Example:sample example, another example, {"name":"sample example"}')
  })
  it('renders object examples', () => {
    const wrapper = shallowMount(PropertyExample, {
      props: {
        example: {
          name: 'sample example',
          description: 'sample description',
        },
      },
    })

    expect(wrapper.findTestId('property-field-example').exists()).toBe(true)
    expect(wrapper.text()).toEqual('Example:{"name":"sample example","description":"sample description"}')
  })
})
