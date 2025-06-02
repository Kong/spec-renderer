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

  it('should return example from schema', () => {
    expect(extractSampleForParam({ schema: { examples: ['xxx'] } }, 'key')).toEqual('xxx')
  })

  it('should handle examples array', () => {
    expect(extractSampleForParam({ examples: ['xxx'] }, 'key')).toEqual('xxx')
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

    console.log(res)
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

