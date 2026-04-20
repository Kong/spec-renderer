import { describe, it, expect } from 'vitest'
import { extractSample, getRequestHeaders, getFormattedBody, getSampleQuery, getSampleBody } from './request-data'
import type { IHttpOperation } from '@stoplight/types'

describe('request-header', () => {
  it('TDX-5963 should grab from request mediaType before looking at response', () => {
    expect(getRequestHeaders({
      request: {
        body: {
          contents: [{
            id: 'xxx',
            mediaType: 'application/x-www-form-urlencoded',
          }],
        },
      },
    } as unknown as IHttpOperation)).toEqual([{ name: 'Content-Type', value: 'application/x-www-form-urlencoded' }])
  })
})

describe('getFormattedBody', () => {
  it('should handle null body', () => {
    // @ts-expect-error verifying null body is handled gracefully
    expect(getFormattedBody({}, null)).toEqual({ body: null, contentType: '' })
  })

  it('should return as is', () => {
    expect(getFormattedBody({ 'content-type': 'plain/text' }, { content: '{a: b}' })).toEqual({ body: '{a: b}', contentType: 'plain/text' })
  })

  it('should return form-url-encoded', () => {
    expect(getFormattedBody({ 'content-type': 'application/x-www-form-urlencoded' }, { content: '{"a": "b", "c": "d"}' })).toEqual({ body: 'a=b&c=d', contentType: 'application/x-www-form-urlencoded' } )

  })
})


describe('getSampleBody', () => {
  it('should wrap array schema body in an array', () => {
    const contents = [{
      id: 'test',
      mediaType: 'application/json',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            firstName: { type: 'string', example: 'John' },
          },
        },
      },
    }]
    expect(getSampleBody(contents as any)).toEqual(JSON.stringify([{ firstName: 'John' }], null, 2))
  })

  it('should not wrap object schema body in an array', () => {
    const contents = [{
      id: 'test',
      mediaType: 'application/json',
      schema: {
        type: 'object',
        properties: {
          firstName: { type: 'string', example: 'John' },
        },
      },
    }]
    expect(getSampleBody(contents as any)).toEqual(JSON.stringify({ firstName: 'John' }, null, 2))
  })
})

describe('extractSample', () => {
  it('should use param name as key when input is an array (Stoplight format)', () => {
    // data.request.query is an IHttpQueryParam array, not a Record.
    // extractSample must use param.name as both the output key and the key
    // passed to extractSampleForParam, not the array index.
    const result = extractSample([
      { name: 'query', schema: { type: 'string' }, examples: [{ id: '1', key: 'default', value: null }] },
      { name: 'page', schema: { type: 'integer' }, examples: [], required: true },
    ])
    expect(result).toEqual({ query: 'query', page: 0 })
  })

  it('only includes params that are required or have an explicit example/default value', () => {
    const result = extractSample([
      { name: 'page', schema: { type: 'integer' }, examples: [], required: true }, // included because required param
      { name: 'endRow', schema: { type: 'integer', default: 75 }, examples: [] }, // included because of default value, even though not required
      { name: 'filter', example: 'active', schema: { type: 'string' } }, // included because of explicit example
      { name: 'status', schema: { type: 'string' }, examples: [{ id: '1', key: 'default', value: 'active' }] }, // included because of explicit example
      { name: 'sort', schema: { type: 'string' }, examples: [] }, // skipped: no example/default value and optional
      { name: 'query', schema: { type: 'string' }, examples: [] }, // skipped: no example/default value and optional
    ])
    expect(result).toEqual({ page: 0, endRow: 75, filter: 'active', status: 'active' })
  })
})

describe('getSampleQuery', () => {
  it('should include required params and exclude non-required params with no example or default', () => {
    expect(getSampleQuery({
      id: '98ddd4beb64c5',
      method: 'get',
      path: '/reports',
      request: {
        query: [
          // @ts-ignore just what's needed for test
          {
            'id': '95551eda46140',
            'name': 'groupNpi',
            'examples': [],
            'description': 'Optional. Provider group NPI',
            'required': false,
            'schema': {
              'type': 'string',
              '$schema': 'http://json-schema.org/draft-07/schema#',
              'description': 'Optional. Provider group NPI',
            },
          },
          // @ts-ignore just what's needed for test
          {
            'id': 'a89c1e7c38da6',
            'name': 'lastName',
            'examples': [],
            'description': 'Optional. Provider last name',
            'required': true,
            'schema': {
              'type': 'string',
              '$schema': 'http://json-schema.org/draft-07/schema#',
              'description': 'Optional. Provider last name',
            },
          },
        ],
      },
    })).toEqual('lastName=lastName')
  })

  it('should skip non-required params whose example value is an explicit empty string', () => {
    expect(getSampleQuery({
      id: 'test-id',
      method: 'get',
      path: '/search',
      request: {
        query: [
          // @ts-ignore
          {
            name: 'optional',
            required: false,
            examples: [{ id: '1', key: 'default', value: '' }],
            schema: { type: 'string' },
          },
          // @ts-ignore
          {
            name: 'required',
            required: true,
            examples: [{ id: '2', key: 'default', value: '' }],
            schema: { type: 'string' },
          },
        ],
      },
    })).toEqual('required=')
  })

  it('should use param names (not array indices) for Stoplight params with null examples', () => {
    expect(getSampleQuery({
      id: '913107ebad7de',
      method: 'get',
      path: '/search',
      request: {
        query: [
          // @ts-ignore
          {
            id: '3aea5c6215895',
            name: 'query',
            required: false,
            examples: [{ id: '94444b275ec09', value: null, key: 'default' }],
            schema: { type: 'string', examples: [null] },
          },
          // @ts-ignore
          {
            id: 'dc4d5d8651257',
            name: 'filter',
            required: false,
            examples: [{ id: '93d27aa688c6b', key: 'default', value: null }],
            schema: { type: 'string' },
          },
        ],
      },
    })).toEqual('query=query&filter=filter')
  })
})
