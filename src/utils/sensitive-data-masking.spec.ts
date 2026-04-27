import { describe, it, expect } from 'vitest'
import {
  maskRegex,
  maskHash,
  applyMask,
  buildSecuritySchemeMaskRules,
  maskAuthHeaders,
  maskAuthQuery,
  maskBodyExample,
  findResponseSchema,
} from './sensitive-data-masking'
import type { XSensitiveData } from '@/types'
import type { HttpSecurityScheme, IHttpOperationResponse } from '@stoplight/types'
import type { JSONSchema7 } from 'json-schema'

describe('applyMask', () => {
  it('returns *** for full mask', () => {
    expect(applyMask('secret', { mask: 'full' })).toBe('***')
  })

  it('returns undefined for remove mask', () => {
    expect(applyMask('secret', { mask: 'remove' })).toBeUndefined()
  })

  it('returns hash string for hash mask', () => {
    const result = applyMask('secret', { mask: 'hash' }) as string
    expect(result).toMatch(/^\[hash:[0-9a-f]{8}\]$/)
  })

  it('applies regex mask with pattern', () => {
    expect(applyMask('hello@example.com', { mask: 'regex', pattern: '^[^@]+' })).toBe('***@example.com')
  })

  it('falls back to *** for regex mask with invalid pattern', () => {
    expect(applyMask('value', { mask: 'regex', pattern: '[invalid' })).toBe('***')
  })

  it('falls back to *** for regex mask without pattern', () => {
    expect(applyMask('value', { mask: 'regex' })).toBe('***')
  })

  it('converts non-string values to string before masking', () => {
    expect(applyMask(12345, { mask: 'full' })).toBe('***')
    expect(applyMask(null, { mask: 'full' })).toBe('***')
  })
})

describe('maskRegex', () => {
  it('replaces matched parts with ***', () => {
    expect(maskRegex('hello world', 'world')).toBe('hello ***')
  })

  it('replaces all occurrences', () => {
    expect(maskRegex('aXbXc', 'X')).toBe('a***b***c')
  })

  it('returns *** for invalid pattern', () => {
    expect(maskRegex('value', '[invalid')).toBe('***')
  })
})

describe('maskHash', () => {
  it('returns a [hash:xxxxxxxx] format string', () => {
    expect(maskHash('anything')).toMatch(/^\[hash:[0-9a-f]{8}\]$/)
  })

  it('produces consistent output for the same input', () => {
    expect(maskHash('consistent')).toBe(maskHash('consistent'))
  })

  it('produces different output for different inputs', () => {
    expect(maskHash('abc')).not.toBe(maskHash('xyz'))
  })
})

describe('buildSecuritySchemeMaskRules', () => {
  it('returns empty array for empty security', () => {
    expect(buildSecuritySchemeMaskRules([])).toEqual([])
  })

  it('creates header rule for apiKey in header', () => {
    const security = [[{ type: 'apiKey', name: 'X-API-Key', in: 'header', key: 'apiKey' }]] as HttpSecurityScheme[][]
    const rules = buildSecuritySchemeMaskRules(security)
    expect(rules).toContainEqual({ location: 'header', paramName: 'X-API-Key', placeholder: '{YOUR_API_KEY}' })
  })

  it('creates query rule for apiKey in query', () => {
    const security = [[{ type: 'apiKey', name: 'api_key', in: 'query', key: 'apiKey' }]] as HttpSecurityScheme[][]
    const rules = buildSecuritySchemeMaskRules(security)
    expect(rules).toContainEqual({ location: 'query', paramName: 'api_key', placeholder: '{YOUR_API_KEY}' })
  })

  it('creates Authorization header rule for http basic', () => {
    const security = [[{ type: 'http', scheme: 'basic', key: 'basicAuth' }]] as HttpSecurityScheme[][]
    const rules = buildSecuritySchemeMaskRules(security)
    expect(rules).toContainEqual({ location: 'header', paramName: 'Authorization', placeholder: 'Basic {CREDENTIALS}' })
  })

  it('creates Authorization header rule for http bearer', () => {
    const security = [[{ type: 'http', scheme: 'bearer', key: 'bearerAuth' }]] as HttpSecurityScheme[][]
    const rules = buildSecuritySchemeMaskRules(security)
    expect(rules).toContainEqual({ location: 'header', paramName: 'Authorization', placeholder: 'Bearer {YOUR_TOKEN}' })
  })

  it('creates Authorization header rule for oauth2', () => {
    const security = [[{ type: 'oauth2', flows: {}, key: 'oauth2' }]] as HttpSecurityScheme[][]
    const rules = buildSecuritySchemeMaskRules(security)
    expect(rules).toContainEqual({ location: 'header', paramName: 'Authorization', placeholder: 'Bearer {ACCESS_TOKEN}' })
  })

  it('deduplicates rules with the same location and paramName', () => {
    const security = [
      [{ type: 'http', scheme: 'bearer', key: 'bearerAuth1' }],
      [{ type: 'oauth2', flows: {}, key: 'oauth2' }],
    ] as HttpSecurityScheme[][]
    const rules = buildSecuritySchemeMaskRules(security)
    const authRules = rules.filter(r => r.paramName === 'Authorization')
    expect(authRules).toHaveLength(1)
  })

  it('deduplicates case-insensitively', () => {
    const security = [
      [{ type: 'apiKey', name: 'X-API-KEY', in: 'header', key: 'a' }],
      [{ type: 'apiKey', name: 'x-api-key', in: 'header', key: 'b' }],
    ] as HttpSecurityScheme[][]
    const rules = buildSecuritySchemeMaskRules(security)
    expect(rules).toHaveLength(1)
  })
})

describe('maskAuthHeaders', () => {
  const rules = [{ location: 'header' as const, paramName: 'Authorization', placeholder: 'Bearer {YOUR_TOKEN}' }]

  it('replaces matching header value with placeholder', () => {
    const headers = [{ name: 'Authorization', value: 'Bearer real-token' }]
    expect(maskAuthHeaders(headers, rules)).toEqual([{ name: 'Authorization', value: 'Bearer {YOUR_TOKEN}' }])
  })

  it('leaves non-matching headers unchanged', () => {
    const headers = [{ name: 'Content-Type', value: 'application/json' }]
    expect(maskAuthHeaders(headers, rules)).toEqual(headers)
  })

  it('matches case-insensitively', () => {
    const headers = [{ name: 'authorization', value: 'Bearer real-token' }]
    const result = maskAuthHeaders(headers, rules)
    expect(result[0]!.value).toBe('Bearer {YOUR_TOKEN}')
  })

  it('returns original array when no rules', () => {
    const headers = [{ name: 'Authorization', value: 'Bearer token' }]
    expect(maskAuthHeaders(headers, [])).toBe(headers)
  })

  it('does not mutate original array', () => {
    const headers = [{ name: 'Authorization', value: 'Bearer real-token' }]
    maskAuthHeaders(headers, rules)
    expect(headers[0]!.value).toBe('Bearer real-token')
  })
})

describe('maskAuthQuery', () => {
  const rules = [{ location: 'query' as const, paramName: 'api_key', placeholder: '{YOUR_API_KEY}' }]

  it('masks matching query param value', () => {
    const result = maskAuthQuery('api_key=secret123', rules)
    expect(result).toContain('api_key=%7BYOUR_API_KEY%7D')
  })

  it('leaves non-matching params unchanged', () => {
    const result = maskAuthQuery('foo=bar&api_key=secret', rules)
    expect(result).toContain('foo=bar')
  })

  it('handles query string with leading ?', () => {
    const result = maskAuthQuery('?api_key=secret', rules)
    expect(result.startsWith('?')).toBe(true)
    expect(result).toContain('api_key=')
  })

  it('returns original string when no rules', () => {
    expect(maskAuthQuery('api_key=secret', [])).toBe('api_key=secret')
  })

  it('returns original string when empty', () => {
    expect(maskAuthQuery('', rules)).toBe('')
  })
})

describe('maskBodyExample', () => {
  it('masks a property with full strategy', () => {
    const example = { password: 'secret' }
    const schema = { properties: { password: { type: 'string', 'x-sensitive-data': { mask: 'full' } as XSensitiveData } } }
    expect(maskBodyExample(example, schema)).toEqual({ password: '***' })
  })

  it('removes a property with remove strategy', () => {
    const example = { token: 'abc', name: 'Alice' }
    const schema = { properties: { token: { type: 'string', 'x-sensitive-data': { mask: 'remove' } as XSensitiveData } } }
    expect(maskBodyExample(example, schema)).toEqual({ name: 'Alice' })
  })

  it('applies regex mask to a property', () => {
    const example = { email: 'user@example.com' }
    const schema = { properties: { email: { type: 'string', 'x-sensitive-data': { mask: 'regex', pattern: '^[^@]+' } as XSensitiveData } } }
    const result = maskBodyExample(example, schema) as Record<string, string>
    expect(result.email).toBe('***@example.com')
  })

  it('leaves properties without x-sensitive-data unchanged', () => {
    const example = { name: 'Alice', age: 30 }
    const schema = { properties: { name: { type: 'string' }, age: { type: 'number' } } }
    expect(maskBodyExample(example, schema)).toEqual({ name: 'Alice', age: 30 })
  })

  it('handles nested objects recursively', () => {
    const example = { user: { password: 'secret', name: 'Alice' } }
    const schema = {
      properties: {
        user: {
          type: 'object',
          properties: {
            password: { type: 'string', 'x-sensitive-data': { mask: 'full' } as XSensitiveData },
            name: { type: 'string' },
          },
        },
      },
    }
    expect(maskBodyExample(example, schema)).toEqual({ user: { password: '***', name: 'Alice' } })
  })

  it('handles arrays by applying schema to each item', () => {
    const example = [{ token: 'abc' }, { token: 'xyz' }]
    const schema = {
      type: 'array',
      items: { properties: { token: { type: 'string', 'x-sensitive-data': { mask: 'full' } as XSensitiveData } } },
    }
    expect(maskBodyExample(example, schema)).toEqual([{ token: '***' }, { token: '***' }])
  })

  it('returns non-object values unchanged', () => {
    expect(maskBodyExample('plain string', {})).toBe('plain string')
    expect(maskBodyExample(42, {})).toBe(42)
    expect(maskBodyExample(null, {})).toBeNull()
  })

  it('does not mutate the original example', () => {
    const example = { password: 'secret' }
    const schema = { properties: { password: { 'x-sensitive-data': { mask: 'full' } as XSensitiveData } } }
    maskBodyExample(example, schema)
    expect(example.password).toBe('secret')
  })
})

describe('findResponseSchema', () => {
  const schema200 = { type: 'object', properties: { id: { type: 'string' } } } as JSONSchema7
  const schema4xx = { type: 'object', properties: { error: { type: 'string' } } } as JSONSchema7
  const schemaDefault = { type: 'object', properties: { message: { type: 'string' } } } as JSONSchema7

  const responses: IHttpOperationResponse[] = [
    { id: 'r1', code: '200', contents: [{ id: 'c1', mediaType: 'application/json', schema: schema200 }] },
    { id: 'r2', code: '4XX', contents: [{ id: 'c2', mediaType: 'application/json', schema: schema4xx }] },
    { id: 'r3', code: 'default', contents: [{ id: 'c3', mediaType: 'application/json', schema: schemaDefault }] },
  ]

  it('returns schema for exact status code match', () => {
    const result = findResponseSchema(responses, 200, 'application/json')
    expect(result).toMatchObject({ type: 'object' })
  })

  it('falls back to wildcard code (4XX) when no exact match', () => {
    const result = findResponseSchema(responses, 404, 'application/json')
    expect(result?.properties).toHaveProperty('error')
  })

  it('falls back to default when no exact or wildcard match', () => {
    const result = findResponseSchema(responses, 503, 'application/json')
    expect(result?.properties).toHaveProperty('message')
  })

  it('returns undefined for empty responses', () => {
    expect(findResponseSchema([], 200, 'application/json')).toBeUndefined()
  })

  it('matches content-type ignoring charset', () => {
    const result = findResponseSchema(responses, 200, 'application/json; charset=utf-8')
    expect(result).toBeDefined()
  })
})
