import { describe, it, expect } from 'vitest'
import { getRequestHeaders } from './request-data'
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

