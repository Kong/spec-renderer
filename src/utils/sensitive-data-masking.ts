import type { HttpSecurityScheme, IHttpOperationResponse } from '@stoplight/types'
import type { XSensitiveData, SecuritySchemeMaskRule } from '@/types'
import { isValidSchemaObject, resolveSchemaObjectFields } from './schema-model'
import { normalizeContentType } from './response'
import { OAS_EXT_SENSITIVE_DATA } from '@/oas-extensions'

// ─── Mask placeholder ─────────────────────────────────────────────────────────

/** The character sequence used to replace masked values in all displayed output. */
export const MASK_PLACEHOLDER = '••••••'

// ─── Basic masking functions ──────────────────────────────────────────────────

/**
 * Replace parts of a string matched by a regex pattern with ••••••.
 *
 * Example:
 *   maskRegex('hello@example.com', '^[^@]+')  →  '••••••@example.com'
 *   maskRegex('aXbXc', 'X')                   →  'a••••••b••••••c'
 */
export const maskRegex = (value: string, pattern: string): string => {
  try {
    // 'g' flag replaces every occurrence, not just the first
    const re = new RegExp(pattern, 'g')
    return value.replace(re, MASK_PLACEHOLDER)
  } catch {
    // Invalid regex pattern — fall back to full mask rather than throwing
    return MASK_PLACEHOLDER
  }
}

/**
 * Return a short deterministic hash string for display purposes (not cryptographic).
 * Useful when you want to show that two values are the same without revealing either.
 *
 * Example:
 *   maskHash('my-secret-token')  →  '3d2a1f8c'
 *   maskHash('my-secret-token')  →  '3d2a1f8c'  (same input → same output)
 *   maskHash('different-token')  →  '7b4e9a12'  (different input → different hash)
 */
export const maskHash = (value: string): string => {
  // djb2-style hash — fast, synchronous, good enough for display-only fingerprinting
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    // hash * 33 XOR char code — standard djb2 bit-mixing step
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i)
    // Keep as unsigned 32-bit integer to prevent negative numbers
    hash = hash >>> 0
  }
  // Pad to 8 hex digits so the output length is always consistent
  return hash.toString(16).padStart(8, '0')
}

/**
 * Apply a mask strategy to any value based on the x-sensitive-data config.
 * Returns undefined when mask is 'remove' (caller should delete the key).
 *
 * Examples:
 *   applyMask('secret123', { mask: 'full' })                        →  '••••••'
 *   applyMask('hello@example.com', { mask: 'regex', pattern: '^[^@]+' })  →  '••••••@example.com'
 *   applyMask('secret123', { mask: 'hash' })                        →  '3d2a1f8c'
 *   applyMask('secret123', { mask: 'remove' })                      →  undefined
 */
export const applyMask = (value: unknown, config: XSensitiveData): unknown => {
  // 'remove' is handled specially — return undefined so the caller can omit the key
  if (config.mask === 'remove') return undefined

  // Coerce to string for strategies that operate on string values
  const str = value === null || value === undefined ? '' : String(value)

  switch (config.mask) {
    case 'full':
      // Replace the entire value with a fixed placeholder
      return MASK_PLACEHOLDER
    case 'regex':
      // Replace only the matched portion; fall back to full mask if no pattern given
      return config.pattern ? maskRegex(str, config.pattern) : MASK_PLACEHOLDER
    case 'hash':
      // Replace the value with a deterministic fingerprint
      return maskHash(str)
    default:
      // Unknown strategy — return the value unchanged to avoid data loss
      return value
  }
}

// ─── Security scheme mask rules ──────────────────────────────────────────────

/**
 * Derive masking rules from an operation's security scheme list.
 * Each rule tells the renderer which param carries a credential and what placeholder to show instead.
 *
 * `security` is HttpSecurityScheme[][] — an array of OR-groups, each group being an array of schemes.
 * We flatten all groups and generate one rule per unique credential location.
 *
 * Example input (from a parsed OpenAPI operation):
 *   security = [
 *     [{ type: 'apiKey', name: 'X-API-Key', in: 'header' }],   // OR group 1
 *     [{ type: 'http', scheme: 'bearer' }],                      // OR group 2
 *   ]
 *
 * Example output:
 *   [
 *     { location: 'header', paramName: 'X-API-Key',     placeholder: '••••••' },
 *     { location: 'header', paramName: 'Authorization', placeholder: '••••••' },
 *   ]
 */
export const buildSecuritySchemeMaskRules = (security: HttpSecurityScheme[][]): SecuritySchemeMaskRule[] => {
  // Track already-added rules to avoid duplicates (e.g. two Bearer schemes → one Authorization rule)
  const seen = new Set<string>()
  const rules: SecuritySchemeMaskRule[] = []

  // Helper that skips a rule if an identical location+paramName was already added
  const add = (rule: SecuritySchemeMaskRule) => {
    // Normalize to lowercase so 'Authorization' and 'authorization' are treated as the same key
    const key = `${rule.location}:${rule.paramName.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      rules.push(rule)
    }
  }

  // Iterate every OR-group, then every scheme within that group
  for (const group of security) {
    for (const scheme of group) {
      if (scheme.type === 'apiKey') {
        // apiKey: the spec tells us exactly which header or query param carries the key
        add({ location: scheme.in, paramName: scheme.name, placeholder: MASK_PLACEHOLDER })
      } else if (scheme.type === 'http' && scheme.scheme === 'basic') {
        // HTTP Basic sends credentials in Authorization as 'Basic <base64-encoded-user:pass>'
        add({ location: 'header', paramName: 'Authorization', placeholder: MASK_PLACEHOLDER })
      } else if (scheme.type === 'http' && (scheme.scheme === 'bearer' || scheme.scheme === 'digest')) {
        // HTTP Bearer / Digest both use the Authorization header
        add({ location: 'header', paramName: 'Authorization', placeholder: MASK_PLACEHOLDER })
      } else if (scheme.type === 'oauth2') {
        // OAuth2 access tokens are passed as 'Bearer <token>' in the Authorization header
        add({ location: 'header', paramName: 'Authorization', placeholder: MASK_PLACEHOLDER })
      }
      // openIdConnect and unknown types are not handled — no known param name to mask
    }
  }

  return rules
}

// ─── Auth header / query masking for code samples ────────────────────────────

/**
 * Return a new headers array with auth header values replaced by their placeholders.
 * Used to sanitize headers before displaying them in code samples.
 * The original array and its objects are never mutated.
 *
 * Example:
 *   headers = [{ name: 'Authorization', value: 'Bearer real-token-abc' }]
 *   rules   = [{ location: 'header', paramName: 'Authorization', placeholder: '••••••' }]
 *   result  → [{ name: 'Authorization', value: '••••••' }]
 */
export const maskAuthHeaders = (
  headers: Array<Record<string, string>>,
  rules: SecuritySchemeMaskRule[],
): Array<Record<string, string>> => {
  // Nothing to do if no rules — return original reference to avoid unnecessary allocations
  if (!rules.length) return headers

  // Only keep header-location rules for this function
  const headerRules = rules.filter(r => r.location === 'header')
  if (!headerRules.length) return headers

  return headers.map(h => {
    // Case-insensitive match: 'authorization' matches 'Authorization'
    const match = headerRules.find(r => r.paramName.toLowerCase() === h.name?.toLowerCase())
    // Spread to create a new object so the original header entry is not mutated
    return match ? { ...h, value: match.placeholder } : h
  })
}

/**
 * Return a new query string with auth query param values replaced by their placeholders.
 * Used to sanitize the query string before displaying it in code samples.
 *
 * Example:
 *   queryString = 'api_key=secret-key-123&page=1'
 *   rules       = [{ location: 'query', paramName: 'api_key', placeholder: '••••••' }]
 *   result      → 'api_key=••••••&page=1'
 */
export const maskAuthQuery = (queryString: string, rules: SecuritySchemeMaskRule[]): string => {
  // Nothing to do if the string is empty or no rules exist
  if (!queryString || !rules.length) return queryString

  // Only keep query-location rules for this function
  const queryRules = rules.filter(r => r.location === 'query')
  if (!queryRules.length) return queryString

  // Preserve a leading '?' if present — URLSearchParams does not include it
  const prefix = queryString.startsWith('?') ? '?' : ''
  const raw = queryString.startsWith('?') ? queryString.slice(1) : queryString
  const params = new URLSearchParams(raw)

  for (const rule of queryRules) {
    // Iterate all keys to handle case-insensitive matching (e.g. 'API_KEY' vs 'api_key')
    for (const key of Array.from(params.keys())) {
      if (key.toLowerCase() === rule.paramName.toLowerCase()) {
        params.set(key, rule.placeholder)
      }
    }
  }

  // URLSearchParams percent-encodes non-ASCII characters (• → %E2%80%A2).
  // Decode the placeholder back to its display form so consumers get a clean string.
  const encoded = encodeURIComponent(MASK_PLACEHOLDER)
  return (prefix + params.toString()).replaceAll(encoded, MASK_PLACEHOLDER)
}

// ─── Body example masking for x-sensitive-data ───────────────────────────────

/**
 * Recursively walk an example value alongside its schema and apply x-sensitive-data masks.
 * Returns a new object — does not mutate the input.
 *
 * Example:
 *   example = { password: 'secret', name: 'Alice', address: { zip: '12345' } }
 *   schema  = {
 *     properties: {
 *       password: { type: 'string', 'x-sensitive-data': { mask: 'full' } },
 *       name:     { type: 'string' },
 *       address:  { type: 'object', properties: { zip: { type: 'string' } } },
 *     }
 *   }
 *   result  → { password: '••••••', name: 'Alice', address: { zip: '12345' } }
 */
export const maskBodyExample = (example: unknown, schema: Record<string, any>): unknown => {
  // Primitive, null, or undefined values have no nested structure to mask
  if (example === null || example === undefined) return example
  if (typeof example !== 'object') return example

  if (Array.isArray(example)) {
    // schema.items may be absent when resolveSchemaObjectFields already hoisted the items
    // properties to the top level for display — fall back to schema itself in that case.
    const rawItemSchema = schema?.items ?? schema
    const itemSchema = rawItemSchema
      ? resolveSchemaObjectFields(rawItemSchema) as Record<string, any>
      : {}
    return example.map(item => maskBodyExample(item, itemSchema))
  }

  const obj = example as Record<string, unknown>
  const result: Record<string, unknown> = {}
  // Resolve $ref / allOf on schema.properties so x-sensitive-data on referenced schemas is found
  const properties: Record<string, any> = schema?.properties ?? {}

  for (const key of Object.keys(obj)) {
    const rawPropSchema = properties[key]
    // Resolve any $ref on the individual property schema before reading x-sensitive-data
    const propSchema = rawPropSchema
      ? resolveSchemaObjectFields(rawPropSchema) as Record<string, any>
      : {}

    const sensitiveConfig = propSchema?.[OAS_EXT_SENSITIVE_DATA] as XSensitiveData | undefined

    if (sensitiveConfig?.mask === 'remove') {
      // 'remove' strategy: simply don't copy this key into the result
    } else if (sensitiveConfig) {
      // Any other mask strategy: replace the value with the masked version
      result[key] = applyMask(obj[key], sensitiveConfig)
    } else if (obj[key] !== null && typeof obj[key] === 'object') {
      // No sensitive config on this key, but the value is a nested object — recurse into it
      result[key] = maskBodyExample(obj[key], propSchema)
    } else {
      // Plain value with no masking needed — copy as-is
      result[key] = obj[key]
    }
  }

  return result
}

// ─── Schema sensitive-data detection ─────────────────────────────────────────

/**
 * Return true if any property in the schema (recursively) has an x-sensitive-data annotation.
 * Used internally by hasMasking — prefer calling hasMasking directly.
 *
 * `seen` guards against a circular `$ref` recursing forever, keyed on each property's raw,
 * pre-resolve object (resolveSchemaObjectFields copies array/allOf schemas on every call, so
 * keying on its output would never match a repeat visit). A visited-once set is safe here since
 * this is a pure boolean predicate: the answer for a schema doesn't depend on which path reached
 * it, and finding sensitive data anywhere already short-circuits the walk.
 */
const _schemaHasSensitiveData = (schema: Record<string, any> | undefined, seen: WeakSet<object> = new WeakSet()): boolean => {
  if (!schema) return false
  for (const propSchema of Object.values(schema.properties ?? {})) {
    if (!isValidSchemaObject(propSchema) || seen.has(propSchema)) continue
    seen.add(propSchema)
    const prop = resolveSchemaObjectFields(propSchema) as Record<string, any>
    if (prop?.[OAS_EXT_SENSITIVE_DATA]) return true
    if (prop?.properties && _schemaHasSensitiveData(prop, seen)) return true
  }
  return false
}

/**
 * Return true when any masking is active — either from x-sensitive-data schema annotations
 * or from security-scheme mask rules. Use this to decide whether to show the masked/unmasked toggle.
 *
 * Example:
 *   hasMasking(schema, [])          — true when schema has x-sensitive-data properties
 *   hasMasking(undefined, rules)    — true when there are auth mask rules
 *   hasMasking(schema, rules)       — true when either applies
 */
export const hasMasking = (
  schema: Record<string, any> | undefined,
  maskRules: SecuritySchemeMaskRule[] = [],
): boolean => {
  return maskRules.length > 0 || _schemaHasSensitiveData(schema)
}

// ─── Response schema lookup ───────────────────────────────────────────────────

/**
 * Find the resolved JSON schema for a response given its HTTP status code and content-type.
 * Falls back to wildcard status codes (e.g. "2XX") then "default" if no exact match found.
 * Returns undefined if no matching schema exists (e.g. empty responses, no schema on the content).
 *
 * Example:
 *   An operation declares responses: 200, 4XX, default.
 *   findResponseSchema(responses, 200, 'application/json')  →  schema for 200
 *   findResponseSchema(responses, 404, 'application/json')  →  schema for 4XX  (wildcard fallback)
 *   findResponseSchema(responses, 503, 'application/json')  →  schema for default
 */
export const findResponseSchema = (
  responses: IHttpOperationResponse[],
  statusCode: number,
  contentType: string,
): Record<string, any> | undefined => {
  if (!responses?.length) return undefined

  const statusStr = String(statusCode)
  const normalizedCT = normalizeContentType(contentType)

  // Build a priority-ordered list of candidates: exact → wildcard (e.g. 2XX) → default
  // Undefined entries (no match) are filtered out before iterating
  const candidates: IHttpOperationResponse[] = [
    // 1. Exact match: '200' matches response with code '200'
    responses.find(r => r.code === statusStr),
    // 2. Wildcard match: '404' matches response with code '4XX' or '4xx' (same first digit)
    responses.find(r => /^[1-5]xx$/i.test(r.code) && r.code[0] === statusStr[0]),
    // 3. Default fallback: catches any status code not matched above
    responses.find(r => r.code === 'default'),
  ].filter((r): r is IHttpOperationResponse => r !== undefined)

  for (const response of candidates) {
    if (!response.contents?.length) continue

    // Prefer the content entry whose media type matches the actual response content-type;
    // fall back to the first content entry if none matches
    const match = response.contents.find(c => c.mediaType.toLowerCase().startsWith(normalizedCT))
      ?? response.contents[0]

    if (match?.schema) {
      // Resolve any $ref / allOf so x-sensitive-data on referenced schemas is accessible
      return resolveSchemaObjectFields(match.schema) as Record<string, any>
    }
  }

  return undefined
}
