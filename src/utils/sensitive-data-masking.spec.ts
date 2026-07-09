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
  hasMasking,
  MASK_PLACEHOLDER,
} from './sensitive-data-masking'
import type { XSensitiveData } from '@/types'
import type { HttpSecurityScheme, IHttpOperationResponse } from '@stoplight/types'
import type { JSONSchema7 } from 'json-schema'

describe('applyMask', () => {
  it('returns MASK_PLACEHOLDER for full mask', () => {
    expect(applyMask('secret', { mask: 'full' })).toBe(MASK_PLACEHOLDER)
  })

  it('returns undefined for remove mask', () => {
    expect(applyMask('secret', { mask: 'remove' })).toBeUndefined()
  })

  it('returns plain hex hash for hash mask', () => {
    const result = applyMask('secret', { mask: 'hash' }) as string
    expect(result).toMatch(/^[0-9a-f]{8}$/)
  })

  it('applies regex mask with pattern', () => {
    expect(applyMask('hello@example.com', { mask: 'regex', pattern: '^[^@]+' })).toBe(`${MASK_PLACEHOLDER}@example.com`)
  })

  it('falls back to MASK_PLACEHOLDER for regex mask with invalid pattern', () => {
    expect(applyMask('value', { mask: 'regex', pattern: '[invalid' })).toBe(MASK_PLACEHOLDER)
  })

  it('falls back to MASK_PLACEHOLDER for regex mask without pattern', () => {
    expect(applyMask('value', { mask: 'regex' })).toBe(MASK_PLACEHOLDER)
  })

  it('converts non-string values to string before masking', () => {
    expect(applyMask(12345, { mask: 'full' })).toBe(MASK_PLACEHOLDER)
    expect(applyMask(null, { mask: 'full' })).toBe(MASK_PLACEHOLDER)
  })
})

describe('maskRegex', () => {
  it('replaces matched parts with MASK_PLACEHOLDER', () => {
    expect(maskRegex('hello world', 'world')).toBe(`hello ${MASK_PLACEHOLDER}`)
  })

  it('replaces all occurrences', () => {
    expect(maskRegex('aXbXc', 'X')).toBe(`a${MASK_PLACEHOLDER}b${MASK_PLACEHOLDER}c`)
  })

  it('returns MASK_PLACEHOLDER for invalid pattern', () => {
    expect(maskRegex('value', '[invalid')).toBe(MASK_PLACEHOLDER)
  })
})

describe('maskHash', () => {
  it('returns an 8-character hex string', () => {
    expect(maskHash('anything')).toMatch(/^[0-9a-f]{8}$/)
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
    expect(rules).toContainEqual({ location: 'header', paramName: 'X-API-Key', placeholder: MASK_PLACEHOLDER })
  })

  it('creates query rule for apiKey in query', () => {
    const security = [[{ type: 'apiKey', name: 'api_key', in: 'query', key: 'apiKey' }]] as HttpSecurityScheme[][]
    const rules = buildSecuritySchemeMaskRules(security)
    expect(rules).toContainEqual({ location: 'query', paramName: 'api_key', placeholder: MASK_PLACEHOLDER })
  })

  it('creates Authorization header rule for http basic', () => {
    const security = [[{ type: 'http', scheme: 'basic', key: 'basicAuth' }]] as HttpSecurityScheme[][]
    const rules = buildSecuritySchemeMaskRules(security)
    expect(rules).toContainEqual({ location: 'header', paramName: 'Authorization', placeholder: MASK_PLACEHOLDER })
  })

  it('creates Authorization header rule for http bearer', () => {
    const security = [[{ type: 'http', scheme: 'bearer', key: 'bearerAuth' }]] as HttpSecurityScheme[][]
    const rules = buildSecuritySchemeMaskRules(security)
    expect(rules).toContainEqual({ location: 'header', paramName: 'Authorization', placeholder: MASK_PLACEHOLDER })
  })

  it('creates Authorization header rule for oauth2', () => {
    const security = [[{ type: 'oauth2', flows: {}, key: 'oauth2' }]] as HttpSecurityScheme[][]
    const rules = buildSecuritySchemeMaskRules(security)
    expect(rules).toContainEqual({ location: 'header', paramName: 'Authorization', placeholder: MASK_PLACEHOLDER })
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
  const rules = [{ location: 'header' as const, paramName: 'Authorization', placeholder: MASK_PLACEHOLDER }]

  it('replaces matching header value with placeholder', () => {
    const headers = [{ name: 'Authorization', value: 'Bearer real-token' }]
    expect(maskAuthHeaders(headers, rules)).toEqual([{ name: 'Authorization', value: MASK_PLACEHOLDER }])
  })

  it('leaves non-matching headers unchanged', () => {
    const headers = [{ name: 'Content-Type', value: 'application/json' }]
    expect(maskAuthHeaders(headers, rules)).toEqual(headers)
  })

  it('matches case-insensitively', () => {
    const headers = [{ name: 'authorization', value: 'Bearer real-token' }]
    const result = maskAuthHeaders(headers, rules)
    expect(result[0]!.value).toBe(MASK_PLACEHOLDER)
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
  const rules = [{ location: 'query' as const, paramName: 'api_key', placeholder: MASK_PLACEHOLDER }]

  it('masks matching query param value', () => {
    const result = maskAuthQuery('api_key=secret123', rules)
    expect(result).toBe(`api_key=${MASK_PLACEHOLDER}`)
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
    expect(maskBodyExample(example, schema)).toEqual({ password: MASK_PLACEHOLDER })
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
    expect(result.email).toBe(`${MASK_PLACEHOLDER}@example.com`)
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
    expect(maskBodyExample(example, schema)).toEqual({ user: { password: MASK_PLACEHOLDER, name: 'Alice' } })
  })

  it('handles arrays by applying schema to each item', () => {
    const example = [{ token: 'abc' }, { token: 'xyz' }]
    const schema = {
      type: 'array',
      items: { properties: { token: { type: 'string', 'x-sensitive-data': { mask: 'full' } as XSensitiveData } } },
    }
    expect(maskBodyExample(example, schema)).toEqual([{ token: MASK_PLACEHOLDER }, { token: MASK_PLACEHOLDER }])
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

describe('hasMasking', () => {
  it('returns false when schema has no x-sensitive-data and no mask rules', () => {
    const schema = { properties: { name: { type: 'string' } } }
    expect(hasMasking(schema, [])).toBe(false)
  })

  it('returns true when schema has x-sensitive-data on a property', () => {
    const schema = { properties: { password: { type: 'string', 'x-sensitive-data': { mask: 'full' } as XSensitiveData } } }
    expect(hasMasking(schema, [])).toBe(true)
  })

  it('returns true when mask rules are present (even without schema)', () => {
    expect(hasMasking(undefined, [{ location: 'header', paramName: 'Authorization', placeholder: MASK_PLACEHOLDER }])).toBe(true)
  })

  it('returns true when both schema and rules are present', () => {
    const schema = { properties: { token: { type: 'string', 'x-sensitive-data': { mask: 'full' } as XSensitiveData } } }
    expect(hasMasking(schema, [{ location: 'header', paramName: 'Authorization', placeholder: MASK_PLACEHOLDER }])).toBe(true)
  })

  it('returns false for undefined schema and empty rules', () => {
    expect(hasMasking(undefined, [])).toBe(false)
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
