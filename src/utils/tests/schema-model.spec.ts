import { describe, it, expect } from 'vitest'
import { isNestedObj, isValidSchemaObject, orderedFieldList, schemaObjectProperties } from '../schema-model'
import type { ReferenceObject, SchemaObject } from '@/types'

describe('isNestedObj', () => {
  it('returns true for property that is a nested object', () => {
    const nestedProperty: SchemaObject = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    }
    expect(isNestedObj(nestedProperty)).toBe(true)
  })

  it('returns false for invalid properties', () => {
    const invalidPropertyList: Array<SchemaObject> = [
      {
        type: 'string',
      },
      {
        type: 'object',
        properties: {},
      },
      {
        type: 'object',
      },
    ]
    for (const property of invalidPropertyList) {
      expect(isNestedObj(property)).toBe(false)
    }
  })
})

describe('isValidSchemaObject', () => {
  it('returns true for valid properties', () => {
    const validPropertyList: Array<SchemaObject | ReferenceObject> = [
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      },
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
        required: ['name'],
      },
      {},
    ]
    for (const property of validPropertyList) {
      expect(isValidSchemaObject(property)).toBe(true)
    }
  })
  it('returns false for invalid properties', () => {
    const invalidPropertyList: Array<SchemaObject | ReferenceObject> = [
      {
        type: 'object',
        $ref: '#/components/schemas/Pet',
      },
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
        $ref: '#/components/schemas/Store',
      },
    ]
    for (const property of invalidPropertyList) {
      expect(isValidSchemaObject(property)).toBe(false)
    }
  })
})

describe('schemaObjectProperties', () => {
  it('returns properties and required fields of a Schema Object', () => {
    const nestedSchemaObject: SchemaObject = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
      required: ['name'],
    }
    expect(schemaObjectProperties(nestedSchemaObject)?.properties).toEqual(nestedSchemaObject.properties)
    expect(schemaObjectProperties(nestedSchemaObject)?.required).toEqual(nestedSchemaObject.required)
  })
  it('returns properties and required fields of a Schema Object of type array', () => {
    const itemProperties: Record<string, SchemaObject> = {
      name: {
        type: 'string',
      },
    }
    const itemRequiredFields = ['name']

    const schemaObject: SchemaObject = {
      type: 'array',
      items: {
        type: 'object',
        properties: itemProperties,
        required: itemRequiredFields,
      },
    }
    expect(schemaObjectProperties(schemaObject)?.properties).toEqual(itemProperties)
    expect(schemaObjectProperties(schemaObject)?.required).toEqual(itemRequiredFields)
  })
  it('returns null for invalid Schema Object', () => {
    const invalidSchemaObjectList: Array<SchemaObject> = [
      {
        type: 'string',
      },
      {
        type: 'object',
        properties: {},
      },
      {
        type: 'object',
      },
    ]

    for (const invalidSchemaObject of invalidSchemaObjectList) {
      expect(schemaObjectProperties(invalidSchemaObject)).toBe(null)
    }
  })
  it('returns null for invalid Schema Object from array', () => {
    const invalidSchemaObjectList: Array<SchemaObject> = [
      {
        type: 'string',
      },
      {
        type: 'array',
      },
      {
        type: 'array',
        items: {},
      },
      {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      },
      {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
          $ref: '#/components/schemas/Pet',
        },
      },
    ]

    for (const invalidSchemaObject of invalidSchemaObjectList) {
      expect(schemaObjectProperties(invalidSchemaObject)).toBe(null)
    }
  })
})

describe('orderedFieldList', () => {
  it('returns the fields in the correct order', () => {
    const itemData: SchemaObject = {
      title: 'sample-title',
      description: 'sample-description',
      enum: ['sample-enum'],
      pattern: '^[0-9]{3}$',
      maximum: 999,
      minimum: 100,
      example: 'lorem ipsum',
    }
    expect(orderedFieldList(itemData)).toEqual(['title', 'description', 'enum', 'pattern', 'maximum', 'example'])
  })
})
