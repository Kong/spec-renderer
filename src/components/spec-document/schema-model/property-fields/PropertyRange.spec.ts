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
    expect(wrapper.text()).toEqual('>= 10<= 100')
  })

  it('renders with only max', () => {
    const wrapper = shallowMount(PropertyRange, {
      props: {
        max: 100,
      },
    })

    expect(wrapper.findTestId('property-field-range').exists()).toBe(true)
    expect(wrapper.text()).toEqual('<= 100')
  })

  it('renders with only min', () => {
    const wrapper = shallowMount(PropertyRange, {
      props: {
        min: 10,
      },
    })

    expect(wrapper.findTestId('property-field-range').exists()).toBe(true)
    expect(wrapper.text()).toEqual('>= 10')
  })

  it('renders with exclusiveMinimum and exclusiveMaximum as booleans', () => {
    const wrapper = shallowMount(PropertyRange, {
      props: {
        min: 10,
        exclusiveMinimum: true,
        max: 100,
        exclusiveMaximum: true,
      },
    })

    expect(wrapper.findTestId('property-field-range').exists()).toBe(true)
    expect(wrapper.text()).toEqual('> 10< 100')
  })

  it('renders with exclusiveMinimum and exclusiveMaximum as numbers', () => {
    const wrapper = shallowMount(PropertyRange, {
      props: {
        min: 10,
        exclusiveMinimum: 11,
        max: 100,
        exclusiveMaximum: 99,
      },
    })

    expect(wrapper.findTestId('property-field-range').exists()).toBe(true)
    expect(wrapper.text()).toEqual('>= 10<= 100> 11< 99')
  })

  it('renders with multipleOf', () => {
    const wrapper = shallowMount(PropertyRange, {
      props: {
        multipleOf: 5,
      },
    })

    expect(wrapper.findTestId('property-field-range').exists()).toBe(true)
    expect(wrapper.text()).toEqual('x 5')
  })

  it('renders with minItems and maxItems', () => {
    const wrapper = shallowMount(PropertyRange, {
      props: {
        minItems: 2,
        maxItems: 5,
      },
    })

    expect(wrapper.findTestId('property-field-range').exists()).toBe(true)
    expect(wrapper.text()).toEqual('>= 2 items<= 5 items')
  })
})
