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

  // the common case: a oneOf/anyOf variant is a plain schema with no oneOf/anyOf of its own.
  // ModelNode has two sibling render blocks - a wrapped variant render, and a flat "properties" loop
  // that renders selectedSchemaModel's own properties directly. When the selected variant is a plain
  // object with properties, both blocks previously rendered the same field: once wrapped (labeled with
  // the variant's own name), once again flat - a visible duplication. The wrapped block should be
  // skipped for this shape; the flat "properties" loop already renders the field on its own.
  it('renders the selected oneOf variant\'s properties without a redundant wrapper', () => {
    const wrapper = mount(ModelNode, {
      props: {
        schema: {
          type: 'object',
          title: 'Root',
          oneOf: [
            { type: 'object', title: 'PlainVariant', properties: { id: { type: 'string' } } },
          ],
        },
        title: 'Root',
      },
    })

    // the field renders once, via the flat properties loop
    expect(wrapper.findTestId('model-property-id').exists()).toBe(true)
    // the wrapped variant render (labeled with the variant's own name) must not also render it
    expect(wrapper.findTestId(`model-property-${kebabCase('PlainVariant')}`).exists()).toBe(false)
    expect(wrapper.findAllComponents(ModelProperty).length).toBe(1)
  })

  it('renders the selected anyOf variant\'s properties without a redundant wrapper', () => {
    const wrapper = mount(ModelNode, {
      props: {
        schema: {
          type: 'object',
          title: 'Root',
          anyOf: [
            { type: 'object', title: 'PlainVariant', properties: { id: { type: 'string' } } },
          ],
        },
        title: 'Root',
      },
    })

    expect(wrapper.findTestId('model-property-id').exists()).toBe(true)
    expect(wrapper.findTestId(`model-property-${kebabCase('PlainVariant')}`).exists()).toBe(false)
    expect(wrapper.findAllComponents(ModelProperty).length).toBe(1)
  })

  // reproduces the reported production bug: a oneOf between a primitive variant (no properties, no
  // further oneOf/anyOf) and an object variant with plain properties (no further oneOf/anyOf either).
  // the default-selected (first) variant must render correctly for either shape - a primitive
  // variant renders nothing extra (its type is conveyed by whatever wraps this ModelNode), and an
  // object variant's property must render exactly once, not duplicated
  it('renders nothing extra when the default-selected variant is a primitive (StringFieldFilter-shaped schema)', () => {
    const stringFieldEqualsFilter: SchemaObject = { type: 'string', title: 'StringFieldEqualsFilter' }
    const stringFieldContainsFilter: SchemaObject = {
      type: 'object',
      title: 'StringFieldContainsFilter',
      properties: { contains: { type: 'string' } },
      required: ['contains'],
    }
    const wrapper = mount(ModelNode, {
      props: {
        schema: {
          type: 'object',
          title: 'StringFieldFilter',
          oneOf: [stringFieldEqualsFilter, stringFieldContainsFilter],
        },
        title: 'StringFieldFilter',
      },
    })

    expect(wrapper.findAllComponents(ModelProperty).length).toBe(0)
  })

  it('does not duplicate a plain object variant\'s properties (StringFieldFilter-shaped schema)', () => {
    const stringFieldEqualsFilter: SchemaObject = { type: 'string', title: 'StringFieldEqualsFilter' }
    const stringFieldContainsFilter: SchemaObject = {
      type: 'object',
      title: 'StringFieldContainsFilter',
      properties: { contains: { type: 'string' } },
      required: ['contains'],
    }
    const wrapper = mount(ModelNode, {
      props: {
        schema: {
          type: 'object',
          title: 'StringFieldFilter',
          // object variant first, so it's the default selection - no dropdown interaction needed
          oneOf: [stringFieldContainsFilter, stringFieldEqualsFilter],
        },
        title: 'StringFieldFilter',
      },
    })

    expect(wrapper.findTestId('model-property-contains').exists()).toBe(true)
    expect(wrapper.findTestId(`model-property-${kebabCase('StringFieldContainsFilter')}`).exists()).toBe(false)
    expect(wrapper.findAllComponents(ModelProperty).length).toBe(1)
  })

  // oneOf/anyOf can be hidden inside a variant's allOf and only surface after allOf-merge
  // resolution. Gating the wrapped render on the RAW variant's oneOf/anyOf (rather than the
  // resolved form) would miss this and silently drop the nested variant and its fields.
  it('still renders a variant whose oneOf is hidden inside its own allOf', () => {
    const inner: SchemaObject = {
      type: 'object',
      title: 'Inner',
      properties: { x: { type: 'string' } },
    }
    const variantWithHiddenOneOf: SchemaObject = {
      type: 'object',
      title: 'VariantWithHiddenOneOf',
      allOf: [{ oneOf: [inner] }],
    }
    const wrapper = mount(ModelNode, {
      props: {
        schema: {
          type: 'object',
          title: 'Root',
          oneOf: [variantWithHiddenOneOf],
        },
        title: 'Root',
      },
    })

    // the variant renders wrapped (correct: it does have further oneOf/anyOf once resolved), and
    // recursion correctly surfaces the nested "Inner" variant it resolves to - proving the allOf
    // wrapping wasn't silently dropped. "Inner"'s own nested properties aren't asserted here: those
    // are gated behind a manual "Show Child Parameters" expand, unrelated to this oneOf/allOf case.
    expect(wrapper.findTestId(`model-property-${kebabCase('VariantWithHiddenOneOf')}`).exists()).toBe(true)
    expect(wrapper.findTestId(`model-property-${kebabCase('Inner')}`).exists()).toBe(true)
  })
})
