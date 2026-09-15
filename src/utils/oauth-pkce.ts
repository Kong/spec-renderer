// Zero-dependency OAuth2 PKCE (RFC 7636) crypto utilities.
//
// Hard rule: never fall back to `code_challenge_method=plain` and never fall back to
// `Math.random()` when `crypto.subtle` is unavailable. Either fallback silently destroys
// PKCE's security guarantee - fail loudly instead (see `PkceUnavailableError`).

import { isOauth2AuthorizationCodeFlow } from '@/stoplight/elements-core/utils/oas/security'
import type { IOauth2SecurityScheme } from '@stoplight/types'
import type { Oauth2PkceTarget } from '@/types'

// ─── Web Crypto access ─────────────────────────────────────────────────────────

/**
 * Read `globalThis.crypto`, never `window.crypto` - this library is server-rendered,
 * and a module-level `window` reference would break SSR. Called at call time, not at
 * module top level, so it always reflects the current environment.
 */
const getCrypto = (): Crypto | undefined => globalThis.crypto

// ─── Charsets ──────────────────────────────────────────────────────────────────

/** RFC 7636 §4.1 unreserved character set (66 chars). Exported for tests/docs only. */
export const PKCE_UNRESERVED = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

// 64-char subset of RFC 7636's unreserved set (identical to the base64url alphabet).
// 64 divides 256 evenly, so `byte & 63` is exactly uniform: no modulo bias and no
// rejection loop. Using all 66 unreserved chars would need rejection sampling; a
// naive `% 66` makes the first 58 characters ~1.5% more likely.
const RANDOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export const MIN_VERIFIER_LENGTH = 43
export const MAX_VERIFIER_LENGTH = 128

// ─── Errors ────────────────────────────────────────────────────────────────────

/** Thrown when the Web Crypto API required for PKCE is unavailable. */
export class PkceUnavailableError extends Error {
  name = 'PkceUnavailableError'
}

// ─── Feature detection ─────────────────────────────────────────────────────────

/**
 * True only when both `crypto.getRandomValues` and `crypto.subtle.digest` are available.
 *
 * Deliberately does NOT check `window.isSecureContext` - it is `undefined` in jsdom,
 * so gating on it would make this feature untestable in this repo's test environment
 * and would misreport availability in any other environment where it's unset.
 */
export const canUsePkce = (): boolean => {
  const c = getCrypto()
  return typeof c?.getRandomValues === 'function' && typeof c?.subtle?.digest === 'function'
}

// ─── Encoding ──────────────────────────────────────────────────────────────────

/**
 * Base64url-encode (RFC 4648 §5) the given bytes: standard base64 via `btoa`, then
 * `+` → `-`, `/` → `_`, and all `=` padding stripped.
 */
export const base64UrlEncode = (input: ArrayBuffer | Uint8Array): string => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)

  // Per-byte loop, not `String.fromCharCode(...bytes)` - the spread form blows the
  // argument limit on large buffers.
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

// ─── Random string generation ─────────────────────────────────────────────────

/**
 * Generate a random string of the given length drawn from `RANDOM_ALPHABET`.
 *
 * Throws `PkceUnavailableError` when `crypto.getRandomValues` is unavailable.
 */
export const randomUnreservedString = (length: number): string => {
  const c = getCrypto()
  if (typeof c?.getRandomValues !== 'function') {
    throw new PkceUnavailableError('crypto.getRandomValues is unavailable - a secure context (https or localhost) is required')
  }

  const bytes = new Uint8Array(length)
  c.getRandomValues(bytes)

  let result = ''
  for (let i = 0; i < length; i++) {
    result += RANDOM_ALPHABET[bytes[i]! & 63]
  }

  return result
}

/**
 * Generate a PKCE code verifier (RFC 7636 §4.1). `length` must be within
 * [43, 128] inclusive, or this throws `RangeError`.
 */
export const generateCodeVerifier = (length = MIN_VERIFIER_LENGTH): string => {
  if (length < MIN_VERIFIER_LENGTH || length > MAX_VERIFIER_LENGTH) {
    throw new RangeError(`generateCodeVerifier: length must be between ${MIN_VERIFIER_LENGTH} and ${MAX_VERIFIER_LENGTH} inclusive, got ${length}`)
  }

  return randomUnreservedString(length)
}

/** Generate a random 32-character `state` parameter value. */
export const generateState = (): string => randomUnreservedString(32)

// ─── Hashing ───────────────────────────────────────────────────────────────────

/**
 * SHA-256 hash of `input` (UTF-8 encoded).
 *
 * Throws `PkceUnavailableError` when `crypto.subtle.digest` is unavailable.
 */
export const sha256 = async (input: string): Promise<ArrayBuffer> => {
  const c = getCrypto()
  if (typeof c?.subtle?.digest !== 'function') {
    throw new PkceUnavailableError('crypto.subtle is unavailable - a secure context (https or localhost) is required')
  }

  return c.subtle.digest('SHA-256', new TextEncoder().encode(input))
}

/** Derive the PKCE `code_challenge` (S256 method) from a code verifier. */
export const generateCodeChallenge = async (verifier: string): Promise<string> => base64UrlEncode(await sha256(verifier))

// ─── Authorize URL ─────────────────────────────────────────────────────────────

export interface BuildAuthorizeUrlParams {
  authorizationUrl: string
  clientId: string
  redirectUri: string
  scope: string
  state: string
  codeChallenge: string
  /** Seam for a future OAS extension - nothing passes this yet. */
  extraParams?: Record<string, string>
}

/** Build the OAuth2 authorization request URL for the PKCE (S256) flow. */
export const buildAuthorizeUrl = (params: BuildAuthorizeUrlParams): string => {
  const {
    authorizationUrl,
    clientId,
    redirectUri,
    scope,
    state,
    codeChallenge,
    extraParams,
  } = params

  const url = new URL(authorizationUrl)

  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  if (scope) {
    url.searchParams.set('scope', scope)
  }
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      url.searchParams.set(key, value)
    }
  }

  return url.toString()
}

// ─── PKCE target flattening ────────────────────────────────────────────────────

/**
 * Flatten an `authorizationCode` security scheme into the shape the flow needs.
 * Returns undefined when the scheme has no usable authorizationCode flow.
 * The fingerprint binds a token to the exact endpoints AND client id it was minted for.
 */
export const buildPkceTarget = (
  schemeKey: string,
  scheme: IOauth2SecurityScheme,
  clientId: string,
): Oauth2PkceTarget | undefined => {
  const flow = scheme.flows?.authorizationCode

  if (!flow || !isOauth2AuthorizationCodeFlow(flow)) {
    return undefined
  }

  const { authorizationUrl, tokenUrl, refreshUrl, scopes } = flow

  // `isOauth2AuthorizationCodeFlow` only checks that the keys are PRESENT, so a spec
  // declaring `authorizationUrl: ''` would otherwise yield a target with empty URLs and
  // blow up later inside `new URL('')`. Treat it as not authorizable instead, so the UI
  // simply disables the Authorize action rather than throwing on click.
  if (!authorizationUrl?.trim() || !tokenUrl?.trim()) {
    return undefined
  }

  return {
    schemeKey,
    authorizationUrl,
    tokenUrl,
    refreshUrl,
    scopes: scopes || {},
    fingerprint: `${authorizationUrl}|${tokenUrl}|${clientId}`,
  }
}
