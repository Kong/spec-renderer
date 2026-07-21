import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ModelProperty from './ModelProperty.vue'
import ModelNode from './ModelNode.vue'
import type { SchemaObject } from '@/types'
import { kebabCase } from '@/utils'

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

  describe('renders oneOf', () => {
    const oneOfList: SchemaObject[] = [
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
      const arrayWithOneOf: SchemaObject = {
        description: 'List of children nodes of the current node',
        type: 'array',
        items: {
          type: 'object',
          oneOf: oneOfList,
        },
        title: 'NodeChildren',
      }

      const wrapper = mount(ModelProperty, {
        props: {
          property: arrayWithOneOf,
          propertyName: 'NodeChildren',
        },
      })

      // Check if ModelProperty component renders for the first oneOf object
      expect(wrapper.findTestId(`model-property-${kebabCase(oneOfList[0].title ?? '')}`).exists()).toBe(true)
    })

    it('when schema model is a simple object', () => {
      const wrapper = mount(ModelProperty, {
        props: {
          property: {
            description: 'List of children nodes of the current node',
            type: 'object',
            oneOf: oneOfList,
          },
          propertyName: 'NodeChildren',
        },
      })

      // Check if ModelProperty component renders for the first oneOf object
      expect(wrapper.findTestId(`model-property-${kebabCase(oneOfList[0].title ?? '')}`).exists()).toBe(true)
    })
  })

  describe('renders anyOf', () => {
    const anyOfList: SchemaObject[] = [
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

      // Check if ModelProperty component renders for the first anyOf object
      expect(wrapper.findTestId(`model-property-${kebabCase(anyOfList[0].title ?? '')}`).exists()).toBe(true)
    })

    it('when schema model is a simple object', () => {
      const wrapper = mount(ModelProperty, {
        props: {
          property: {
            description: 'List of children nodes of the current node',
            type: 'object',
            anyOf: anyOfList,
          },
          propertyName: 'NodeChildren',
        },
      })

      // Check if ModelProperty component renders for the first anyOf object
      expect(wrapper.findTestId(`model-property-${kebabCase(anyOfList[0].title ?? '')}`).exists()).toBe(true)
    })
  })

  // when a variant is blocked as circular, the sibling `v-else-if="nestedPropertiesPresent"`
  // branch must not fall through and re-render the very same schema via a fresh ModelNode -
  // that bypasses the guard entirely (it only re-triggers one hop later) and, with a
  // config'd maxExpandedDepth above 1, mounts several duplicate copies of the same node before
  // depth (not the cycle guard) finally stops it
  it('does not fall through to re-render nested properties when a variant is blocked as circular', () => {
    const treeNode: SchemaObject = {
      type: 'object',
      title: 'TreeNode',
      properties: {
        id: { type: 'string' },
      },
    }
    // a nested property whose own oneOf cycles back to the root schema - the guard blocks this
    // variant, and the bug was in what happens next on this same ModelProperty
    const variant: SchemaObject = { oneOf: [treeNode] }
    treeNode.properties!.variant = variant

    const wrapper = mount(ModelProperty, {
      props: {
        property: treeNode,
        propertyName: 'root',
      },
      global: {
        provide: {
          'max-expanded-depth': ref(5),
        },
      },
    })

    // only the single ModelNode rendered for the root schema's own properties should exist -
    // not further duplicates of the same schema re-entered through the blocked variant
    expect(wrapper.findAllComponents(ModelNode).length).toBe(1)
  })
})
