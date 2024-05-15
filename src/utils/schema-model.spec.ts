import { describe, it, expect } from 'vitest'
import { filterSchemaObjectArray, isValidSchemaObject, resolveSchemaObjectFields } from './schema-model'
import type { SchemaObject } from '@/types'

describe('isValidSchemaObject', () => {
  it('returns true for valid properties', () => {
    const validPropertyList: Array<SchemaObject> = [
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
    const invalidPropertyList = [
      null,
      ['a', 'b'],
      'a string',
    ]
    for (const property of invalidPropertyList) {
      expect(isValidSchemaObject(property)).toBe(false)
    }
  })
})

describe('resolveSchemaObjectFields', () => {
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
    expect(resolveSchemaObjectFields(nestedSchemaObject)?.properties).toEqual(nestedSchemaObject.properties)
    expect(resolveSchemaObjectFields(nestedSchemaObject)?.required).toEqual(nestedSchemaObject.required)
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
    expect(resolveSchemaObjectFields(schemaObject)?.properties).toEqual(itemProperties)
    expect(resolveSchemaObjectFields(schemaObject)?.required).toEqual(itemRequiredFields)
  })
  it('returns null for invalid Schema Object', () => {
    const invalidSchemaObjectList = [
      [{
        type: 'object',
        $ref: '#/components/schemas/Pet',
      }],
      null,
      true,
    ]

    for (const invalidSchemaObject of invalidSchemaObjectList) {
      expect(resolveSchemaObjectFields(invalidSchemaObject)).toBe(null)
    }
  })
  it('returns null for invalid Schema Object from array', () => {
    const invalidSchemaObjectList = [
      null,
      false,
      [{
        type: 'object',
        $ref: '#/components/schemas/Pet',
      }],
      {
        type: 'array',
        items: true,
      },
    ]

    for (const invalidSchemaObject of invalidSchemaObjectList) {
      expect(resolveSchemaObjectFields(invalidSchemaObject)).toBe(null)
    }
  })
})

describe('filterSchemaObjectArray', () => {
  it('returns an empty array for invalid input', () => {
    expect(filterSchemaObjectArray(null)).toEqual([])
    expect(filterSchemaObjectArray(true)).toEqual([])
    expect(filterSchemaObjectArray({ a: 123 })).toEqual([])
  })
  it('returns an empty array for empty array input', () => {
    expect(filterSchemaObjectArray([])).toEqual([])
  })
  it('returns an array of valid Schema Objects', () => {
    const validSchemaObjectList: Array<SchemaObject> = [
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
    expect(filterSchemaObjectArray(validSchemaObjectList)).toEqual(validSchemaObjectList)
  })
  it('filters out invalid Schema Objects', () => {
    const validItems = [
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
    ]
    const invalidSchemaObjectList = [
      null,
      ['a', 'b'],
      'a string',
      ...validItems,
    ]
    expect(filterSchemaObjectArray(invalidSchemaObjectList)).toEqual(validItems)
  })
})
