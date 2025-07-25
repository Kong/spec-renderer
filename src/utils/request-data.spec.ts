import { describe, it, expect } from 'vitest'
import { getRequestHeaders, getFormattedBody, getSampleQuery } from './request-data'
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
    expect(getFormattedBody({}, null)).toEqual({ body: null, contentType: '' })
  })

  it('should return as is', () => {
    expect(getFormattedBody({ 'content-type': 'plain/text' }, { content: '{a: b}' })).toEqual({ body: '{a: b}', contentType: 'plain/text' })
  })

  it('should return form-url-encoded', () => {
    expect(getFormattedBody({ 'content-type': 'application/x-www-form-urlencoded' }, { content: '{"a": "b", "c": "d"}' })).toEqual({ body: 'a=b&c=d', contentType: 'application/x-www-form-urlencoded' } )

  })
})


describe('getSampleQuery', () => {
  it('should skip empty non-required values', () => {
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
            'explicitProperties': [
              'name',
              'in',
              'required',
              'description',
              'schema',
            ],
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
            'explicitProperties': [
              'name',
              'in',
              'required',
              'description',
              'schema',
            ],
          },
        ],
      },
    })).toEqual('lastName=')
  })
})
