// Zero-dependency OAuth2 PKCE (RFC 7636) crypto utilities.
// Never fall back to code_challenge_method=plain or Math.random() when crypto.subtle is unavailable, fail loudly instead.

import { isOauth2AuthorizationCodeFlow } from '@/stoplight/elements-core/utils/oas/security'
import type { IOauth2SecurityScheme } from '@stoplight/types'
import type { BuildAuthorizeUrlParams, Oauth2PkceTarget } from '@/types'

// Reads globalThis.crypto not window.crypto since this runs during SSR too.
const getCrypto = (): Crypto | undefined => globalThis.crypto

// 64-char subset of the unreserved set, 64 divides 256 evenly.
// byte & 63 is exactly uniform, unlike a naive % 66 which biases the first chars.
const RANDOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

// RFC 7636 minimum, 258 bits of randomness
const VERIFIER_LENGTH = 43

/** Thrown when the Web Crypto API required for PKCE is unavailable. */
export class PkceUnavailableError extends Error {
  name = 'PkceUnavailableError'
}

/** True only when crypto.getRandomValues and crypto.subtle.digest are available. Skips window.isSecureContext since it's undefined in jsdom. */
export const canUsePkce = (): boolean => {
  const c = getCrypto()
  return typeof c?.getRandomValues === 'function' && typeof c?.subtle?.digest === 'function'
}

/** Base64url-encode (RFC 4648 §5) the given bytes via btoa, then swap +/ for -_ and strip = padding. */
export const base64UrlEncode = (input: ArrayBuffer | Uint8Array): string => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)

  // Per-byte loop, not String.fromCharCode(...bytes), the spread form blows the argument limit on large buffers.
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

/** Generate a random string of the given length from RANDOM_ALPHABET. Throws PkceUnavailableError when crypto.getRandomValues is unavailable. */
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

/** Generate a PKCE code verifier (RFC 7636 §4.1). */
export const generateCodeVerifier = (): string => randomUnreservedString(VERIFIER_LENGTH)

/** Generate a random 32-character `state` parameter value. */
export const generateState = (): string => randomUnreservedString(32)

/** SHA-256 hash of input (UTF-8 encoded). Throws PkceUnavailableError when crypto.subtle.digest is unavailable. */
export const sha256 = async (input: string): Promise<ArrayBuffer> => {
  const c = getCrypto()
  if (typeof c?.subtle?.digest !== 'function') {
    throw new PkceUnavailableError('crypto.subtle is unavailable - a secure context (https or localhost) is required')
  }

  return c.subtle.digest('SHA-256', new TextEncoder().encode(input))
}

/** Derive the PKCE `code_challenge` (S256 method) from a code verifier. */
export const generateCodeChallenge = async (verifier: string): Promise<string> => base64UrlEncode(await sha256(verifier))

/** Build the OAuth2 authorization request URL for the PKCE (S256) flow. */
export const buildAuthorizeUrl = (params: BuildAuthorizeUrlParams): string => {
  const {
    authorizationUrl,
    clientId,
    redirectUri,
    scope,
    state,
    codeChallenge,
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

  return url.toString()
}

/**
 * Flatten an authorizationCode security scheme into the shape the flow needs, or undefined if unusable.
 * The fingerprint binds a token to the exact endpoints and client id it was minted for.
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

  // isOauth2AuthorizationCodeFlow only checks keys are present, an empty authorizationUrl would blow up new URL('').
  // Treat as not authorizable so the UI disables Authorize instead of throwing.
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
