import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PropertyDescription from '../PropertyDescription.vue'

const description = 'sample description'

describe('<PropertyDescription />', () => {
  it('renders description correctly', () => {
    const wrapper = shallowMount(PropertyDescription, {
      props: {
        description,
      },
    })

    expect(wrapper.findTestId('property-field-description').exists()).toBe(true)
    expect(wrapper.text()).toEqual(description)
  })
})
