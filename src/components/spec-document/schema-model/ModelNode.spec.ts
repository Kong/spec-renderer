import { describe, it, expect } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import ModelNode from './schema-model/ModelNode.vue'
import type { SchemaObject } from '@/types'

describe('<ModelNode />', () => {
  // test for a simple model with properties
  it('renders all properties of a model', () => {
    const data: SchemaObject = {
      description: "I'm a model's description.",
      type: 'object',
      title: 'Todo',
      examples: {
        id: 1,
        name: 'Buy milk',
        completed: true,
        completed_at: '2021-01-01T00:00:00.000Z',
      },
      properties: {
        id: {
          type: 'number',
          minimum: 0,
          maximum: 9999,
          description: 'ID of the task',
          readOnly: true,
        },
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'Name of the task',
        },
        completed: {
          type: 'boolean',
          default: false,
          description: 'Boolean indicating if the task has been completed or not',
        },
        completed_at: {
          type: 'string',
          format: 'date-time',
          description: 'Time when the task was completed',
          readOnly: true,
        },
      },
      required: ['id', 'name'],
    }

    const title = 'Todo'
    const wrapper = shallowMount(ModelNode, {
      props: {
        data,
        title,
      },
    })

    for (const property in data.properties) {
      expect(wrapper.findTestId(`model-property-${property}`).exists()).toBe(true)
    }
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
      const arrayWithOneOf: SchemaObject = {
        description: 'List of children nodes of the current node',
        type: 'array',
        items: {
          type: 'object',
          oneOf: oneOfList,
        },
        title: 'NodeChildren',
      }

      const wrapper = mount(ModelNode, {
        props: {
          data: arrayWithOneOf,
          title: 'NodeChildren',
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
      const wrapper = mount(ModelNode, {
        props: {
          data: {
            description: 'List of children nodes of the current node',
            type: 'object',
            oneOf: oneOfList,
          },
          title: 'NodeChildren',
        },
      })

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

      const wrapper = mount(ModelNode, {
        props: {
          data: arrayWithanyOf,
          title: 'NodeChildren',
        },
      })

      // Check if PropertyanyOf component renders
      expect(wrapper.findTestId('property-field-any-of').exists()).toBe(true)

      // Check if ModelProperty component renders for both anyOf objects
      for (const anyOfItem of anyOfList) {
        expect(wrapper.findTestId(`model-property-${anyOfItem.title}`).exists()).toBe(true)
      }
    })

    it('when schema model is a simple object', () => {
      const wrapper = mount(ModelNode, {
        props: {
          data: {
            description: 'List of children nodes of the current node',
            type: 'object',
            anyOf: anyOfList,
          },
          title: 'NodeChildren',
        },
      })

      // Check if PropertyAnyOf component renders
      expect(wrapper.findTestId('property-field-any-of').exists()).toBe(true)

      // Check if ModelProperty component renders for both anyOf objects
      for (const anyOfItem of anyOfList) {
        expect(wrapper.findTestId(`model-property-${anyOfItem.title}`).exists()).toBe(true)
      }
    })
  })
})
