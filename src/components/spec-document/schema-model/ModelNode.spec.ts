import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ModelNode from './ModelNode.vue'
import type { SchemaObject } from '@/types'

describe('<ModelNode />', () => {
  // test for a simple model with properties
  it('renders all properties of a model', () => {
    const schema: SchemaObject = {
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
        schema,
        title,
      },
    })

    for (const property in schema.properties) {
      expect(wrapper.findTestId(`model-property-${property}`).exists()).toBe(true)
    }
  })
})
