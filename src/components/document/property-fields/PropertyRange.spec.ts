import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PropertyRange from './PropertyRange.vue'

describe('<PropertyRange />', () => {
  it('renders with both max and min', () => {
    const wrapper = shallowMount(PropertyRange, {
      props: {
        max: 100,
        min: 10,
      },
    })
    expect(wrapper.findTestId('property-field-range').exists()).toBe(true)
    expect(wrapper.text()).toEqual('Max: 100 | Min: 10')
  })
  it('renders with only max', () => {
    const wrapper = shallowMount(PropertyRange, {
      props: {
        max: 100,
      },
    })
    expect(wrapper.findTestId('property-field-range').exists()).toBe(true)
    expect(wrapper.text()).toEqual('Max: 100')
  })
  it('renders with both max and min', () => {
    const wrapper = shallowMount(PropertyRange, {
      props: {
        min: 10,
      },
    })
    expect(wrapper.findTestId('property-field-range').exists()).toBe(true)
    expect(wrapper.text()).toEqual('Min: 10')
  })
})
