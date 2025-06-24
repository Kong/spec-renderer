import { describe, it, expect } from 'vitest'
import { getRequestHeaders, getFormattedBody } from './request-data'
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
    expect(getFormattedBody({ 'content-type': 'plain/text' }, '{a: b}')).toEqual({ body: '{a: b}', contentType: 'plain/text' })

  })

  it('should return form-url-encoded', () => {
    expect(getFormattedBody({ 'content-type': 'application/x-www-form-urlencoded' }, '{"a": "b", "c": "d"}')).toEqual({ body: 'a=b&c=d', contentType: 'application/x-www-form-urlencoded' } )

  })
})

