import { describe, it, expect } from 'vitest'
import { crawl, extractSampleForParam } from './schema-example'
import type { SchemaObject } from '@/types'
import householdSpec from '../../sandbox/public/specs/Household_openspec_V11.json'
import composables from '@/composables'

describe('extractSampleForParam', () => {
  it('should return empty for no data', () => {
    expect(extractSampleForParam(undefined, 'key')).toEqual('')
  })

  it('should return example property if present', () => {
    expect(extractSampleForParam({ example: 'xxx' }, 'key')).toEqual('xxx')
  })

  it('should extract value from example object with value field', () => {
    expect(extractSampleForParam({ example: { value: 'xxx' } }, 'key')).toEqual('xxx')
  })

  it('should extract numeric value from example object with value field', () => {
    expect(extractSampleForParam({ example: { value: 42 } }, 'key')).toEqual(42)
  })

  it('should return example from schema', () => {
    expect(extractSampleForParam({ schema: { examples: ['xxx'] } }, 'key')).toEqual('xxx')
  })

  it('should extract value from schema examples object with value field', () => {
    expect(extractSampleForParam({ schema: { examples: [{ value: 'xxx' }] } }, 'key')).toEqual('xxx')
  })

  it('should return schema example if present', () => {
    expect(extractSampleForParam({ schema: { example: 'xxx' } }, 'key')).toEqual('xxx')
  })

  it('should extract value from schema example object with value field', () => {
    expect(extractSampleForParam({ schema: { example: { value: 99 } } }, 'key')).toEqual(99)
  })

  it('should handle examples array', () => {
    expect(extractSampleForParam({ examples: ['xxx'] }, 'key')).toEqual('xxx')
  })

  it('should extract value from examples array object with value field', () => {
    expect(extractSampleForParam({ examples: [{ value: 'xxx' }] }, 'key')).toEqual('xxx')
  })

  it('should return first element of enum', () => {
    expect(extractSampleForParam({ enum: ['a', 'b'] }, 'key')).toEqual('a')
  })

  it('should return default if string', () => {
    expect(extractSampleForParam({ default: 'xxx' }, 'key')).toEqual('xxx')
  })

  it('should return default as stringified object', () => {
    expect(extractSampleForParam({ default: { a: 'xxx' } }, 'key')).toEqual('{"a":"xxx"}')
  })

  it('should return default for boolean type', () => {
    expect(extractSampleForParam({ type: 'boolean' }, 'key')).toBeFalsy()
  })

  it('should return default for integer type', () => {
    expect(extractSampleForParam({ type: 'integer' }, 'key')).toEqual(0)
  })

  it('should return default for number type', () => {
    expect(extractSampleForParam({ type: 'number' }, 'key')).toEqual(0)
  })

  it('should return key for string type', () => {
    expect(extractSampleForParam({ type: 'string' }, 'key')).toEqual('key')
  })

  it('should return object for object', () => {
    expect(extractSampleForParam({ type: 'object' }, 'key')).toEqual('{}')
  })
  it('should return array for array', () => {
    expect(extractSampleForParam({ type: 'array' }, 'key')).toEqual('[]')
  })

  it('should return example if defined in the schema', () => {
    expect(extractSampleForParam({
      'name': 'groupNumber',
      'style': 'simple',
      'examples': [
        {
          'id': '92b28d2be6cbd',
          'value': 92,
          'key': 'default',
        },
      ],
      'schema': {
        'type': 'integer',
        'format': 'int64',
        'example': 92,
      },
    }, 'groupNumber')).toEqual(92)
  })

})

describe('crawl', () => {
  it('should handle undefined', () => {
    // @ts-expect-error need to test against undefined
    expect(crawl({ objData: undefined, filteringOptions: { excludeReadonly: false, excludeNotRequired: false } })).toEqual({})
  })

  it('should handle empty object', () => {
    const objData = {}
    expect(crawl({ objData, filteringOptions: { excludeReadonly: false, excludeNotRequired: false } })).toEqual({})
  })

  it('should handle circular references', () => {
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
        refToName: {
          type: 'number',
        },
      },
      required: ['age'],
    }
    const objData: SchemaObject = {
      type: 'object',
      allOf: [firstAllOfObject, secondAllOfObject],
    }

    expect(crawl({ objData, filteringOptions: { excludeReadonly: false, excludeNotRequired: false } })).toEqual({ age: 0, name: 'name', refToName: 0 })
  })

  it('should handle array example', () => {
    const objData = {
      'type': 'object',
      'properties': {
        'numbers': {
          'type': 'array',
          'items': {
            'type': 'integer',
            'example': [1, 2, 3],
          },
        },
      },
    }

    const res = crawl({ objData, filteringOptions: { excludeReadonly: false, excludeNotRequired: false } })
    expect(res).toEqual({
      'numbers': [
        1,
        2,
        3,
      ],
    })
  })

  it('TDX-5892, value from enum', () => {

    const objData = {
      'description': 'Represents a limited time period for which a value is constant.',
      'type': 'array',
      'minItems': 1,
      'title': 'Face Amount Schedule Entry',
      'properties': {
        'from': {
          'description': 'starting point for the value, inclusive',
          'type': 'integer',
          'minimum': 1,
          'examples': [
            1,
          ],
        },
        'value': {
          'oneOf': [
            {
              'examples': [
                250000,
              ],
              'type': 'number',
              'format': 'double',
              'x-stoplight': {
                'explicitProperties': [
                  'type',
                  'format',
                ],
              },
              'minimum': -1.7976931348623157e+308,
              'maximum': 1.7976931348623157e+308,
            },
            {
              'examples': [
                250000,
              ],
              'title': 'Face Amount Option',
              'type': 'string',
              'enum': [
                'SOLVE_FOR_TARGET_CASH_VALUE',
                'MINIMUM_NON_MEC',
              ],
            },
          ],
        },
      },
      'itemType': 'object',
    }
    const res = crawl({ objData, filteringOptions: { excludeReadonly: false, excludeNotRequired: false } })

    expect(res).toEqual({ from: 1, value: 250000 })
  })

  it('TDX-5890, parsing schema', async () => {

    const { parseSpecDocument, parsedDocument } = composables.useSchemaParser()
    await parseSpecDocument(householdSpec)

    const node = parsedDocument.value.children.find((child: any) => child.uri === '/schemas/System.Exception')


    const result = crawl({ objData: node.data, filteringOptions: { excludeReadonly: false, excludeNotRequired: false } })
    expect(result).toBeInstanceOf(Object)
  })
})

