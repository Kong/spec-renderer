import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ModelProperty from './ModelProperty.vue'
import type { SchemaObject } from '@/types'

describe('<ModelProperty />', () => {
  it('renders all fields of a property', () => {
    const wrapper = mount(ModelProperty, {
      props: {
        property: {
          type: 'integer',
          format: 'int32',
          description: 'sample description',
          examples: 'lorem ipsum',
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

  it('renders all fields of a nested property', () => {
    const wrapper = mount(ModelProperty, {
      props: {
        property: {
          type: 'object',
          description: 'Period of time data is returned for.',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              description:
                "Timestamp specifying the lower bound of the query's time range.",
            },
            end: {
              type: 'string',
              format: 'date-time',
              description:
                "Timestamp specifying the upper bound of the query's time range.",
            },
          },
        },
        propertyName: 'time-range',
        requiredFields: ['time_range', 'query_id', 'size', 'offset'],
      },
    })

    const componentList = [
      // top level property
      'model-property-time-range',
      // nested properties
      'model-property-start',
      'model-property-end',
    ]

    for (const component of componentList) {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    }
  })

  it('renders all fields of items of an array property', () => {
    const wrapper = mount(ModelProperty, {
      props: {
        property: {
          type: 'array',
          description: 'A sample array description',
          items: {
            properties: {
              'sample-item-1': {
                type: 'integer',
                format: 'int32',
                examples: '34',
              },
              'sample-item-2': {
                type: 'string',
                examples: 'abc',
              },
            },
            required: ['sample-item-1'],
          },
        },
        propertyName: 'sample-property',
      },
    })

    const componentList = [
      // top level property
      'model-property-sample-property',
      // nested item properties
      'model-property-sample-item-1',
      'model-property-sample-item-2',
    ]

    for (const component of componentList) {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    }
  })

  it('does not render readonly fields if readonlyVisible is false', () => {
    const wrapper = mount(ModelProperty, {
      props: {
        property: {
          type: 'string',
          properties: {
            start: {
              type: 'string',
              readOnly: false,
            },
            end: {
              type: 'string',
              readOnly: true,
            },
          },
        },
        propertyName: 'time-range',
        readonlyVisible: false,
      },
    })

    console.log(wrapper.html())

    // Verify if the parent model property is rendered
    expect(wrapper.findTestId('model-property-time-range').exists()).toBe(true)

    // the nested property with `readOnly = false` should render
    expect(wrapper.findTestId('model-property-start').exists()).toBe(true)
    // the nested property with `readOnly = true` should not render
    expect(wrapper.findTestId('model-property-end').exists()).toBe(false)
  })

  describe('renders oneOf', () => {
    const oneOfList: Array<SchemaObject> = [
      {
        type: 'object',
        title: 'HeadingBlock',
      },
      {
        type: 'object',
        title: 'BlockQuoteBlock',
      },
    ]

    it('when schema model is an array', () => {

      const wrapper = mount(ModelProperty, {
        props: {
          property: {
            description: 'List of children nodes of the current node',
            type: 'array',
            items: {
              type: 'object',
              oneOf: oneOfList,
            },
            title: 'NodeChildren',
          },
          propertyName: 'NodeChildren',
        },
      })

      // Check if PropertyOneOf component renders
      expect(wrapper.findTestId('property-field-one-of').exists()).toBe(true)

      // Check if ModelProperty component renders for both oneOf objects
      for (const oneOfItem of oneOfList) {
        expect(wrapper.findTestId(`model-property-${oneOfItem.title}`).exists()).toBe(true)
      }
    })

    it('when schema model is a simple object', () => {
      const wrapper = mount(ModelProperty, {
        props: {
          property: {
            type: 'object',
            oneOf: oneOfList,
          },
          propertyName: 'sample-property',
        },
      })

      // Check if PropertyOneOf component renders
      expect(wrapper.findTestId('property-field-one-of').exists()).toBe(true)
      // Check if ModelProperty component renders for both oneOf objects
      for (const oneOfItem of oneOfList) {
        expect(wrapper.findTestId(`model-property-${oneOfItem.title}`).exists()).toBe(true)
      }
    })

    it('when schema model is a nested object', () => {
      const wrapper = mount(ModelProperty, {
        props: {
          property: {
            type: 'object',
            properties: {
              'nested-property': {
                type: 'string',
                oneOf: oneOfList,
              },
            },
          },
          propertyName: 'sample-property',
        },
      })

      // Check if ModelProperty component renders for the nested property
      expect(wrapper.findTestId('model-property-nested-property').exists()).toBe(true)
      // Check if PropertyOneOf component renders
      expect(wrapper.findTestId('property-field-one-of').exists()).toBe(true)
      // Check if ModelProperty component renders for both oneOf objects
      for (const oneOfItem of oneOfList) {
        expect(wrapper.findTestId(`model-property-${oneOfItem.title}`).exists()).toBe(true)
      }
    })
  })

  describe('renders anyOf', () => {
    const anyOfList: Array<SchemaObject> = [
      {
        type: 'object',
        title: 'HeadingBlock',
      },
      {
        type: 'object',
        title: 'BlockQuoteBlock',
      },
    ]

    it('when schema model is an array', () => {
      const arrayWithanyOf: SchemaObject = {
        description: 'List of children nodes of the current node',
        type: 'array',
        items: {
          type: 'object',
          anyOf: anyOfList,
        },
        title: 'NodeChildren',
      }

      const wrapper = mount(ModelProperty, {
        props: {
          property: arrayWithanyOf,
          propertyName: 'NodeChildren',
        },
      })

      // Check if PropertyanyOf component renders
      expect(wrapper.findTestId('property-field-any-of').exists()).toBe(true)

      // Check if ModelProperty component renders for both anyOf objects
      for (const anyOfItem of anyOfList) {
        expect(wrapper.findTestId(`model-property-${anyOfItem.title}`).exists()).toBe(true)
      }
    })
  })
})
