import { describe, it, expect } from 'vitest'
import { filterSchemaObjectArray, isValidSchemaObject, removeFieldsFromSchemaObject, resolveSchemaObjectFields } from './schema-model'
import type { SchemaObject } from '@/types'

describe('isValidSchemaObject', () => {
  it('returns true for valid properties', () => {
    const validPropertyList: SchemaObject[] = [
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
  it('returns properties and required fields of a Schema Object of multiple types', () => {
    const itemProperties: Record<string, SchemaObject> = {
      name: {
        type: 'string',
      },
    }
    const itemRequiredFields = ['name']

    const schemaObject: SchemaObject = {
      type: ['array', 'null'],
      items: {
        type: 'object',
        properties: itemProperties,
        required: itemRequiredFields,
      },
    }
    expect(resolveSchemaObjectFields(schemaObject)?.properties).toEqual(itemProperties)
    expect(resolveSchemaObjectFields(schemaObject)?.required).toEqual(itemRequiredFields)
  })
  it('merges items and properties of a Schema Object of type array correctly', () => {
    // fields under items
    const itemProperties: Record<string, SchemaObject> = {
      name: {
        type: 'string',
      },
    }
    const itemRequiredFields = ['name']

    // fields directly under the schema object
    const schemaDescription = 'Example description'

    const schemaObject: SchemaObject = {
      type: 'array',
      description: schemaDescription,
      readOnly: true,
      items: {
        type: 'object',
        properties: itemProperties,
        required: itemRequiredFields,
      },
    }
    expect(resolveSchemaObjectFields(schemaObject)?.properties).toEqual(itemProperties)
    expect(resolveSchemaObjectFields(schemaObject)?.required).toEqual(itemRequiredFields)
    expect(resolveSchemaObjectFields(schemaObject)?.description).toEqual(schemaDescription)
    expect(resolveSchemaObjectFields(schemaObject)?.readOnly).toEqual(true)
  })
  it('returns empty objects for invalid Schema Object', () => {
    const invalidSchemaObjectList = [
      [{
        type: 'object',
        $ref: '#/components/schemas/Pet',
      }],
      null,
      true,
    ]

    for (const invalidSchemaObject of invalidSchemaObjectList) {
      expect(resolveSchemaObjectFields(invalidSchemaObject)).toStrictEqual({})
    }
  })
  it('returns original object for invalid items field in an array schema', () => {
    const invalidSchemaObjectList = [
      {
        type: 'array',
        items: true,
      },
      {
        type: 'array',
        items: null,
      },
      {
        type: 'array',
      },
      {
        type: ['array', 'null'],
        items: true,
      },
    ]

    for (const invalidSchemaObject of invalidSchemaObjectList) {
      expect(resolveSchemaObjectFields(invalidSchemaObject)).toStrictEqual(invalidSchemaObject)
    }
  })
  it('returns Schema Object with merged allOf fields', () => {
    const firstAllOfObject: SchemaObject = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
      required: ['name'],
    }
    const secondAllOfObject: SchemaObject = {
      type: 'object',
      properties: {
        age: {
          type: 'number',
        },
      },
      required: ['age'],
    }
    const schemaObject: SchemaObject = {
      type: 'object',
      allOf: [firstAllOfObject, secondAllOfObject],
    }
    const expectedSchemaObject: SchemaObject = {
      type: 'object',
      properties: { ...firstAllOfObject.properties, ...secondAllOfObject.properties },
      required: [...(secondAllOfObject.required as string[]), ...(firstAllOfObject.required as string[])],
    }
    expect(resolveSchemaObjectFields(schemaObject)).toStrictEqual(expectedSchemaObject)
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
    const validSchemaObjectList: SchemaObject[] = [
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

describe('removeReadonlyFields', () => {
  describe('removes readOnly fields', () => {
    it('from a simple schema object', () => {
      const schemaObject: SchemaObject = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            readOnly: true,
          },
          age: {
            type: 'number',
          },
        },
        required: ['age'],
      }
      const expectedSchemaObject: SchemaObject = {
        type: 'object',
        properties: {
          age: {
            type: 'number',
          },
        },
        required: ['age'],
      }
      expect(removeFieldsFromSchemaObject(schemaObject)).toEqual(expectedSchemaObject)
    })

    it('from a schema object with array items', () => {
      const schemaObject: SchemaObject = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              readOnly: true,
            },
            age: {
              type: 'number',
            },
          },
          required: ['age'],
        },
      }
      const expectedSchemaObject: SchemaObject = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            age: {
              type: 'number',
            },
          },
          required: ['age'],
        },
      }
      expect(removeFieldsFromSchemaObject(schemaObject)).toEqual(expectedSchemaObject)
    })

    it('from a schema object with oneOf', () => {
      const schemaObject: SchemaObject = {
        type: 'object',
        oneOf: [{
          type: 'object',
          properties: {
            name: {
              type: 'string',
              readOnly: true,
            },
            age: {
              type: 'number',
            },
          },
          required: ['age'],
        },
        // this object is readOnly, so it should be removed
        {
          type: 'object',
          readOnly: true,
          properties: {
            field1: {
              type: 'string',
            },
            field2: {
              type: 'number',
            },
          },
          required: ['field1'],
        }],
      }
      const expectedSchemaObject: SchemaObject = {
        type: 'object',
        oneOf: [{
          type: 'object',
          properties: {
            age: {
              type: 'number',
            },
          },
          required: ['age'],
        }],
      }
      expect(removeFieldsFromSchemaObject(schemaObject)).toEqual(expectedSchemaObject)
    })

    it('from a schema object with anyOf', () => {
      const schemaObject: SchemaObject = {
        type: 'object',
        anyOf: [{
          type: 'object',
          properties: {
            name: {
              type: 'string',
              readOnly: true,
            },
            age: {
              type: 'number',
            },
          },
          required: ['age'],
        },
        // this object is readOnly, so it should be removed
        {
          type: 'object',
          readOnly: true,
          properties: {
            field1: {
              type: 'string',
            },
            field2: {
              type: 'number',
            },
          },
          required: ['field1'],
        }],
      }
      const expectedSchemaObject: SchemaObject = {
        type: 'object',
        anyOf: [{
          type: 'object',
          properties: {
            age: {
              type: 'number',
            },
          },
          required: ['age'],
        }],
      }
      expect(removeFieldsFromSchemaObject(schemaObject)).toEqual(expectedSchemaObject)
    })

    it('from a deeply nested schema object', () => {
      const schemaObject: SchemaObject = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            readOnly: true,
          },
          age: {
            type: 'object',
            properties: {
              year: {
                type: 'string',
                readOnly: true,
              },
              month: {
                type: 'number',
              },
            },
          },
        },
        required: ['age'],
      }
      const expectedSchemaObject: SchemaObject = {
        type: 'object',
        properties: {
          age: {
            type: 'object',
            properties: {
              month: {
                type: 'number',
              },
            },
          },
        },
        required: ['age'],
      }
      expect(removeFieldsFromSchemaObject(schemaObject)).toEqual(expectedSchemaObject)
    })
  })
})
