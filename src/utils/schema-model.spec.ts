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
  it('returns Schema Object with merged allOf fields when circular references exist', () => {
    const parentSchema: SchemaObject = { type: 'object', allOf: [] }
    const firstAllOfObject: SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
      oneOf: [parentSchema], // circular reference back to parentSchema
    }
    const secondAllOfObject: SchemaObject = {
      type: 'object',
      properties: {
        age: { type: 'number' },
      },
      required: ['age'],
    }
    parentSchema.allOf = [firstAllOfObject, secondAllOfObject]

    const result = resolveSchemaObjectFields(parentSchema)
    expect(result.properties).toHaveProperty('name')
    expect(result.properties).toHaveProperty('age')
    expect(result.required).toContain('name')
    expect(result.required).toContain('age')
  })

  it('preserves title in Schema Object with merged allOf fields when circular references exist', () => {
    const parentSchema: SchemaObject = { title: 'ParentTitle', type: 'object', allOf: [] }
    const firstAllOfObject: SchemaObject = {
      type: 'object',
      properties: { name: { type: 'string' } },
      oneOf: [parentSchema], // circular reference back to parentSchema
    }
    parentSchema.allOf = [firstAllOfObject, { type: 'object', properties: { age: { type: 'number' } } }]

    const result = resolveSchemaObjectFields(parentSchema)
    expect(result.title).toBe('ParentTitle')
    expect(result.properties).toHaveProperty('name')
    expect(result.properties).toHaveProperty('age')
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

  it('lets a sibling `examples` override an allOf branch\'s `examples`, instead of concatenating both', () => {
    // shape produced by @stoplight/http-spec, which converts `example` -> `examples: [value]`
    // independently at every schema level (both the allOf branch and the containing schema)
    const schemaObject: SchemaObject = {
      allOf: [
        { type: 'string', description: 'A generic string.', examples: ['foo'] },
      ],
      description: 'A specific, overriding description.',
      examples: ['bar'],
    }

    const result = resolveSchemaObjectFields(schemaObject)
    expect(result.examples).toStrictEqual(['bar'])
    expect(result.example).toBeUndefined()
  })

  it('lets a sibling `example` override an allOf branch\'s `example`, instead of allof-merge\'s default behavior', () => {
    const allOfItem: SchemaObject = { type: 'string', description: 'A generic string.', example: 'foo' }
    const schemaObject: SchemaObject = {
      allOf: [allOfItem],
      description: 'A specific, overriding description.',
      example: 'bar',
    }

    const result = resolveSchemaObjectFields(schemaObject)
    expect(result.example).toBe('bar')
    expect(result.examples).toBeUndefined()
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

    it('from a self-referencing (circular) schema object without throwing', () => {
      // a schema whose `items` property points back to the schema object itself, as happens
      // when the parser dereferences a recursive OpenAPI `$ref` with `circular: true`
      const properties: Record<string, SchemaObject> = {
        id: {
          type: 'string',
        },
        name: {
          type: 'string',
          readOnly: true,
        },
      }
      const schemaObject: SchemaObject = {
        type: 'object',
        properties,
        required: ['id'],
      }
      // create a genuine circular reference: schemaObject.properties.children.items === schemaObject
      properties.children = {
        type: 'array',
        items: schemaObject,
      }

      let result: SchemaObject | undefined
      expect(() => {
        result = removeFieldsFromSchemaObject(schemaObject)
      }).not.toThrow()

      // readOnly fields are still removed from the reachable, non-circular part of the schema
      expect(result?.properties?.id).toEqual({ type: 'string' })
      expect(result?.properties?.name).toBeUndefined()
      // the circular branch is preserved without infinitely re-expanding
      expect(result?.properties?.children).toBeDefined()
      // readOnly fields are still stripped from the schema object returned at the cycle boundary
      // itself (schemaObject.properties.children.items resolves back to schemaObject) - the
      // filter must not leak through just because further recursion stops there
      const children = result?.properties?.children as SchemaObject | undefined
      const cyclePoint = children?.items as SchemaObject | undefined
      expect(cyclePoint?.properties?.id).toEqual({ type: 'string' })
      expect(cyclePoint?.properties?.name).toBeUndefined()
    })

    it('continues stripping readOnly fields around every lap of a cycle, without ever handing back a live reference to the original input', () => {
      // regression test: an earlier version of this fix only shallow-filtered the object
      // returned at the cycle boundary, so following the cycle one hop further than that
      // (schemaObject -> children.items -> children.items again) landed back on the raw,
      // un-filtered, mutable original schemaObject - re-exposing readOnly fields and letting
      // callers mutate the caller's original spec document through the "filtered" result
      const properties: Record<string, SchemaObject> = {
        id: { type: 'string' },
        name: { type: 'string', readOnly: true },
      }
      const schemaObject: SchemaObject = { type: 'object', properties, required: ['id'] }
      properties.children = { type: 'array', items: schemaObject }

      const result = removeFieldsFromSchemaObject(schemaObject)
      const resultChildren = result.properties?.children as SchemaObject | undefined
      const oneHop = resultChildren?.items as SchemaObject | undefined
      const oneHopChildren = oneHop?.properties?.children as SchemaObject | undefined
      const twoHops = oneHopChildren?.items as SchemaObject | undefined

      expect(twoHops?.properties?.name).toBeUndefined()
      expect(twoHops).not.toBe(schemaObject)
    })

    it('from a schema object that directly references itself via a property (not through items)', () => {
      // schemaObject.properties.self === schemaObject, a cycle reached without going through
      // an array `items` boundary at all
      const properties: Record<string, SchemaObject> = {
        id: { type: 'string' },
        name: { type: 'string', readOnly: true },
      }
      const schemaObject: SchemaObject = {
        type: 'object',
        properties,
        required: ['id'],
      }
      properties.self = schemaObject

      let result: SchemaObject | undefined
      expect(() => {
        result = removeFieldsFromSchemaObject(schemaObject)
      }).not.toThrow()

      expect(result?.properties?.id).toEqual({ type: 'string' })
      expect(result?.properties?.name).toBeUndefined()
      expect(result?.properties?.self).toBeDefined()
      // readOnly fields are also stripped from the object returned at the cycle boundary itself
      const cyclePoint = result?.properties?.self as SchemaObject | undefined
      expect(cyclePoint?.properties?.id).toEqual({ type: 'string' })
      expect(cyclePoint?.properties?.name).toBeUndefined()
    })

    it('from a schema object with a circular reference inside oneOf', () => {
      // the oneOf branch's own properties eventually cycle back to the top-level object
      const parentSchema: SchemaObject = { type: 'object', properties: {}, oneOf: [] }
      const oneOfProperties: Record<string, SchemaObject> = {
        name: { type: 'string', readOnly: true },
        age: { type: 'number' },
        parent: parentSchema,
      }
      parentSchema.oneOf = [{ type: 'object', properties: oneOfProperties }]

      let result: SchemaObject | undefined
      expect(() => {
        result = removeFieldsFromSchemaObject(parentSchema)
      }).not.toThrow()

      const resultOneOf = result?.oneOf?.[0] as SchemaObject
      expect(resultOneOf.properties?.age).toEqual({ type: 'number' })
      expect(resultOneOf.properties?.name).toBeUndefined()
      expect(resultOneOf.properties?.parent).toBeDefined()
    })

    it('from a schema object with a circular reference inside anyOf', () => {
      const parentSchema: SchemaObject = { type: 'object', properties: {}, anyOf: [] }
      const anyOfProperties: Record<string, SchemaObject> = {
        name: { type: 'string', readOnly: true },
        age: { type: 'number' },
        parent: parentSchema,
      }
      parentSchema.anyOf = [{ type: 'object', properties: anyOfProperties }]

      let result: SchemaObject | undefined
      expect(() => {
        result = removeFieldsFromSchemaObject(parentSchema)
      }).not.toThrow()

      const resultAnyOf = result?.anyOf?.[0] as SchemaObject
      expect(resultAnyOf.properties?.age).toEqual({ type: 'number' })
      expect(resultAnyOf.properties?.name).toBeUndefined()
      expect(resultAnyOf.properties?.parent).toBeDefined()
    })

    it('filters readOnly fields nested under an array-typed oneOf/anyOf branch, not just the branch\'s own properties', () => {
      // regression test: oneOf/anyOf branches only ever had their own `.properties` filtered
      // (via filterSchemaProperties), then were spread back in raw - so a branch that was itself
      // an array (`items`) or contained a further nested oneOf/anyOf was copied through
      // completely unfiltered, by live reference to the original input. This is the same class
      // of leak fixed elsewhere for properties/items, just left open for oneOf/anyOf branches.
      const schemaWithOneOf: SchemaObject = {
        oneOf: [
          {
            type: 'array',
            items: { type: 'object', properties: { secret: { type: 'string', readOnly: true } } },
          },
        ],
      }
      const resultOneOf = removeFieldsFromSchemaObject(schemaWithOneOf)
      const oneOfItems = resultOneOf.oneOf?.[0] as SchemaObject | undefined
      const oneOfItemsSchema = oneOfItems?.items as SchemaObject | undefined
      expect(oneOfItemsSchema?.properties?.secret).toBeUndefined()
      expect(oneOfItemsSchema).not.toBe((schemaWithOneOf.oneOf?.[0] as SchemaObject).items)

      const schemaWithAnyOf: SchemaObject = {
        anyOf: [
          {
            type: 'array',
            items: { type: 'object', properties: { secret: { type: 'string', readOnly: true } } },
          },
        ],
      }
      const resultAnyOf = removeFieldsFromSchemaObject(schemaWithAnyOf)
      const anyOfItems = resultAnyOf.anyOf?.[0] as SchemaObject | undefined
      const anyOfItemsSchema = anyOfItems?.items as SchemaObject | undefined
      expect(anyOfItemsSchema?.properties?.secret).toBeUndefined()
      expect(anyOfItemsSchema).not.toBe((schemaWithAnyOf.anyOf?.[0] as SchemaObject).items)
    })

    it('filters readOnly independently from a schema shared (non-circularly) by sibling properties', () => {
      // two properties pointing at the *same* reusable component schema object is a common,
      // legitimate pattern in dereferenced OpenAPI documents - it must not be mistaken for a
      // cycle and skipped on its second occurrence
      const shared: SchemaObject = {
        type: 'object',
        properties: {
          secret: { type: 'string', readOnly: true },
          visible: { type: 'string' },
        },
      }
      const schemaObject: SchemaObject = {
        type: 'object',
        properties: {
          a: shared,
          b: shared,
        },
      }

      const result = removeFieldsFromSchemaObject(schemaObject)

      expect(result.properties?.a).toEqual({ type: 'object', properties: { visible: { type: 'string' } } })
      expect(result.properties?.b).toEqual({ type: 'object', properties: { visible: { type: 'string' } } })
    })

    it('from a very deeply nested (non-circular) schema chain without stack-overflowing', () => {
      // added because the live production crash this fix targets surfaced as
      // "RangeError: Maximum call stack size exceeded", not the simpler circular-JSON TypeError
      // covered above - the `seen` cycle guard alone doesn't prevent that, since a single
      // JSON.stringify call still walks the *entire* remaining subtree natively in one shot;
      // this asserts the last-resort catch handles pure nesting depth too
      const DEPTH = 5000
      const root: SchemaObject = { type: 'object', properties: {} }
      let current = root
      for (let i = 0; i < DEPTH; i++) {
        const next: SchemaObject = { type: 'object', properties: {} }
        current.properties!.child = next
        current = next
      }

      expect(() => removeFieldsFromSchemaObject(root)).not.toThrow()
    })
  })

  describe('error handling in filtering steps', () => {
    // each step's try/catch is meant to tolerate stack depth (RangeError) only - anything else
    // is a real bug in filterMethod (or a future regression) and must surface, not vanish into
    // a silently unfiltered field
    const throwingFilterMethod = (property: SchemaObject): boolean => {
      if (property.title === 'boom') throw new Error('unexpected filter error')
      return Boolean(property.readOnly)
    }

    it('propagates a non-RangeError thrown while filtering properties', () => {
      const schemaObject: SchemaObject = {
        type: 'object',
        properties: { bad: { type: 'string', title: 'boom' } },
      }
      expect(() => removeFieldsFromSchemaObject(schemaObject, throwingFilterMethod)).toThrow('unexpected filter error')
    })

    it('propagates a non-RangeError thrown while filtering items', () => {
      const schemaObject: SchemaObject = {
        type: 'array',
        items: { type: 'object', properties: { bad: { type: 'string', title: 'boom' } } },
      }
      expect(() => removeFieldsFromSchemaObject(schemaObject, throwingFilterMethod)).toThrow('unexpected filter error')
    })

    it('propagates a non-RangeError thrown while filtering oneOf', () => {
      const schemaObject: SchemaObject = {
        oneOf: [{ type: 'object', title: 'boom' }],
      }
      expect(() => removeFieldsFromSchemaObject(schemaObject, throwingFilterMethod)).toThrow('unexpected filter error')
    })

    it('propagates a non-RangeError thrown while filtering anyOf', () => {
      const schemaObject: SchemaObject = {
        anyOf: [{ type: 'object', title: 'boom' }],
      }
      expect(() => removeFieldsFromSchemaObject(schemaObject, throwingFilterMethod)).toThrow('unexpected filter error')
    })

    // a real 5000-level-deep schema is not a valid way to test this: JSON.stringify serializes
    // the whole graph regardless of recursion depth, so it always overflows on the outermost
    // call, before recursion ever reaches these four steps. Throwing RangeError directly from
    // filterMethod exercises each step's own catch instead.
    const rangeErrorFilterMethod = (): boolean => {
      throw new RangeError('simulated stack depth')
    }

    it('swallows a RangeError while filtering properties and keeps the clone', () => {
      const schemaObject: SchemaObject = { type: 'object', properties: { child: { type: 'string' } } }
      let result: SchemaObject | undefined
      expect(() => {
        result = removeFieldsFromSchemaObject(schemaObject, rangeErrorFilterMethod)
      }).not.toThrow()
      expect(result?.properties).toEqual(schemaObject.properties)
    })

    it('swallows a RangeError while filtering items and keeps the clone', () => {
      const schemaObject: SchemaObject = { type: 'array', items: { type: 'object', properties: { child: { type: 'string' } } } }
      let result: SchemaObject | undefined
      expect(() => {
        result = removeFieldsFromSchemaObject(schemaObject, rangeErrorFilterMethod)
      }).not.toThrow()
      expect(result?.items).toEqual(schemaObject.items)
    })

    it('swallows a RangeError while filtering oneOf and keeps the clone', () => {
      const schemaObject: SchemaObject = { oneOf: [{ type: 'object', title: 'A' }] }
      let result: SchemaObject | undefined
      expect(() => {
        result = removeFieldsFromSchemaObject(schemaObject, rangeErrorFilterMethod)
      }).not.toThrow()
      expect(result?.oneOf).toEqual(schemaObject.oneOf)
    })

    it('swallows a RangeError while filtering anyOf and keeps the clone', () => {
      const schemaObject: SchemaObject = { anyOf: [{ type: 'object', title: 'A' }] }
      let result: SchemaObject | undefined
      expect(() => {
        result = removeFieldsFromSchemaObject(schemaObject, rangeErrorFilterMethod)
      }).not.toThrow()
      expect(result?.anyOf).toEqual(schemaObject.anyOf)
    })
  })
})
