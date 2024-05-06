import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PropertyExample from './PropertyExample.vue'

const example = 'sample example string'

describe('<PropertyExample />', () => {
  it('renders', () => {
    const wrapper = shallowMount(PropertyExample, {
      props: {
        example,
      },
    })

    expect(wrapper.findTestId('property-field-example').exists()).toBe(true)
    expect(wrapper.text()).toEqual(`Example: ${example}`)
  })
})
