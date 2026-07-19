import { describe, it, expect } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import ModelNode from './ModelNode.vue'
import ModelProperty from './ModelProperty.vue'
import type { SchemaObject } from '@/types'
import { kebabCase } from '@/utils'

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

  // a schema whose oneOf/anyOf variants cycle back to an ancestor renders eagerly (unlike
  // nested properties, which need a manual "Show Child Parameters" click), so without a
  // recursion cap this would mount ModelNode/ModelProperty forever and crash the tab
  it('does not recurse forever when oneOf variants form a cycle', () => {
    const schemaA: SchemaObject = { type: 'object', title: 'A' }
    const schemaB: SchemaObject = { type: 'object', title: 'B' }
    schemaA.oneOf = [schemaB]
    schemaB.oneOf = [schemaA]

    expect(() => {
      mount(ModelNode, {
        props: {
          schema: schemaA,
          title: 'A',
        },
      })
    }).not.toThrow()
  })

  it('does not recurse forever when anyOf variants form a cycle', () => {
    const schemaA: SchemaObject = { type: 'object', title: 'A' }
    const schemaB: SchemaObject = { type: 'object', title: 'B' }
    schemaA.anyOf = [schemaB]
    schemaB.anyOf = [schemaA]

    expect(() => {
      mount(ModelNode, {
        props: {
          schema: schemaA,
          title: 'A',
        },
      })
    }).not.toThrow()
  })

  // the ancestor-chain guard should stop exactly at the repeated schema, not merely somewhere
  // before an arbitrary depth backstop - so a 2-node cycle should render each schema once, not
  // loop around several times before the backstop catches it
  it('stops at the exact repeat rather than looping until a depth backstop is hit', () => {
    const schemaA: SchemaObject = { type: 'object', title: 'A' }
    const schemaB: SchemaObject = { type: 'object', title: 'B' }
    schemaA.oneOf = [schemaB]
    schemaB.oneOf = [schemaA]

    const wrapper = mount(ModelNode, {
      props: {
        schema: schemaA,
        title: 'A',
      },
    })

    // A renders once (top-level ModelNode's variant branch renders schema B, which then tries
    // to render A again as its own variant - that repeat is where the guard must stop)
    expect(wrapper.findAllComponents(ModelProperty).length).toBe(1)
    expect(wrapper.findTestId(`model-property-${kebabCase('B')}`).exists()).toBe(true)
  })

  // a legitimately deep, non-circular chain of distinct oneOf variants must render in full -
  // proving the ancestor-chain guard (which only stops on an actual repeat) doesn't truncate
  // valid content the way a blunt depth cap would
  it('fully renders a long chain of distinct oneOf variants with no repeats', () => {
    const CHAIN_LENGTH = 20
    const schemas: SchemaObject[] = Array.from({ length: CHAIN_LENGTH }, (_, i) => ({
      type: 'object',
      title: `Variant${i}`,
    }))
    schemas.forEach((schema, i) => {
      if (i < schemas.length - 1) {
        schema.oneOf = [schemas[i + 1]]
      }
    })

    const wrapper = mount(ModelNode, {
      props: {
        schema: schemas[0],
        title: 'Variant0',
      },
    })

    for (let i = 1; i < CHAIN_LENGTH; i++) {
      expect(wrapper.findTestId(`model-property-${kebabCase(`Variant${i}`)}`).exists()).toBe(true)
    }
  })
})
