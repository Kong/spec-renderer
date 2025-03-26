import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PropertyFieldList from './PropertyFieldList.vue'
import type { SchemaObject } from '@/types'

describe('<PropertyFieldList />', () => {
  const baseProps = {
    property: {
      type: 'object',
      description: 'test description',
      enum: ['a', 'b', 'c'],
      pattern: '^test$',
      default: 'default value',
      example: 'example value',
      additionalProperties: true,
    } as SchemaObject,
    propertyName: 'testProperty',
  }

  describe('showProperty method', () => {
    it('returns false when field is in hiddenFieldList', () => {
      const wrapper = mount(PropertyFieldList, {
        props: {
          ...baseProps,
          hiddenFieldList: ['description'],
        },
      })

      // Description field should not be rendered
      expect(wrapper.findTestId('property-field-description').exists()).toBe(false)
    })

    it('returns true when field is not in hiddenFieldList', () => {
      const wrapper = mount(PropertyFieldList, {
        props: {
          ...baseProps,
          hiddenFieldList: ['pattern'],
        },
      })

      // Description field should be rendered
      expect(wrapper.findTestId('property-field-description').exists()).toBe(true)
    })

    it('returns true only for explicitly defined fields when x-stoplight.explicitProperties is present', () => {
      const wrapper = mount(PropertyFieldList, {
        props: {
          property: {
            ...baseProps.property,
            'x-stoplight': {
              explicitProperties: ['description'],
            },
          },
          propertyName: baseProps.propertyName,
        },
      })

      // Description field should be rendered (explicitly defined)
      expect(wrapper.findTestId('property-field-description').exists()).toBe(true)
      // Enum field should not be rendered (not explicitly defined)
      expect(wrapper.findTestId('property-field-enum').exists()).toBe(false)
    })

    it('returns true for all fields when x-stoplight.explicitProperties is not present', () => {
      const wrapper = mount(PropertyFieldList, {
        props: baseProps,
      })

      // All fields with values should be rendered
      expect(wrapper.findTestId('property-field-info').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-description').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-enum').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-pattern').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-default').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-example').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-additional-properties').exists()).toBe(true)
    })

    it('handles null/undefined x-stoplight property correctly', () => {
      const wrapper = mount(PropertyFieldList, {
        props: {
          property: {
            ...baseProps.property,
            'x-stoplight': undefined,
          },
          propertyName: baseProps.propertyName,
        },
      })

      // All fields with values should be rendered
      expect(wrapper.findTestId('property-field-info').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-description').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-enum').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-pattern').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-default').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-example').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-additional-properties').exists()).toBe(true)
    })

    it('handles empty explicitProperties array correctly', () => {
      const wrapper = mount(PropertyFieldList, {
        props: {
          property: {
            ...baseProps.property,
            'x-stoplight': {
              explicitProperties: [],
            },
          },
          propertyName: baseProps.propertyName,
        },
      })

      // All fields with values should be rendered
      expect(wrapper.findTestId('property-field-info').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-description').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-enum').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-pattern').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-default').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-example').exists()).toBe(true)
      expect(wrapper.findTestId('property-field-additional-properties').exists()).toBe(true)
    })
  })
})
