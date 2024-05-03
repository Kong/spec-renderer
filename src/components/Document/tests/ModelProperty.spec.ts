import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ModelProperty from '../ModelProperty.vue'

describe('<ModelProperty />', () => {
  it('renders all fields of a property', () => {
    const wrapper = mount(ModelProperty, {
      props: {
        property: {
          type: 'integer',
          format: 'int32',
          description: 'sample description',
          example: 'lorem ipsum',
          enum: [100, 200, 300],
          pattern: '^[0-9]{3}$',
          maximum: 999,
          minimum: 100,
          items: {
            type: 'string',
          },
        },
        propertyName: 'sample-property',
        requiredFields: ['sample-property', 'property-a', 'property-b'],
      },
    })

    const componentList = [
      'property-field-description',
      'property-field-example',
      'property-field-enum',
      'property-field-info',
      'property-field-pattern',
      'property-field-range',
    ]

    for (const component of componentList) {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    }
  })
})
