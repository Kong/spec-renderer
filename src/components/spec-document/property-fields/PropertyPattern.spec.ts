import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PropertyPattern from './PropertyPattern.vue'

const pattern = '^[0-9]{3}$'

describe('<PropertyPattern />', () => {
  it('renders enum as valid values correctly', () => {
    const wrapper = shallowMount(PropertyPattern, {
      props: {
        pattern,
      },
    })

    expect(wrapper.findTestId('property-field-pattern').exists()).toBe(true)
    expect(wrapper.text()).toEqual(`Allowed pattern: ${pattern}`)
  })
})
