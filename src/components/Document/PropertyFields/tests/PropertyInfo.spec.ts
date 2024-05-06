import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PropertyInfo from '../PropertyInfo.vue'

describe('<PropertyInfo />', () => {
  it('correctly renders all data provided as props', () => {
    const wrapper = shallowMount(PropertyInfo, {
      props: {
        title: 'sample-title',
        propertyType: 'string',
        format: 'date-time',
        propertyItemType: 'string',
        requiredFields: ['sample-title', 'another-property'],
      },
    })

    const componentList = [
      'property-field-info',
      'property-field-title',
      'property-field-type',
      'property-field-item-type',
      'property-field-format',
      'property-field-required',
    ]

    for (const component of componentList) {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    }
  })
})
