// OAuth2 PKCE (RFC 7636) helpers.
// Never fall back to code_challenge_method=plain or Math.random() when Web Crypto is missing, fail instead.

import { isOauth2AuthorizationCodeFlow } from '@/stoplight/elements-core/utils/oas/security'
import type { IOauth2SecurityScheme } from '@stoplight/types'
import type { BuildAuthorizeUrlParams, Oauth2PkceTarget, PkceChallenge } from '@/types'

/** Verify if the Web Crypto parts (that PKCE needs) exist. */
export const canUsePkce = (): boolean =>
  typeof globalThis.crypto?.getRandomValues === 'function' && typeof globalThis.crypto?.subtle?.digest === 'function'

/**
  * Verify whether the provided raw URL is an absolute http(s) URL.
  * Endpoints mentioned in spec are untrusted, a vulnerable javascript: URL would execute in the popup.
 */
export const isAbsoluteHttpUrl = (raw: string): boolean => {
  try {
    const { protocol } = new URL(raw)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

// The characters the random strings are built from. Total length is 64, which is a power of two, so every character gets picked with equal chance.
const RANDOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/** A random string of the given length, built from RANDOM_ALPHABET. */
const randomString = (length: number): string => {
  let result = ''
  for (const byte of globalThis.crypto.getRandomValues(new Uint8Array(length))) {
    result += RANDOM_ALPHABET[byte & 63]
  }
  return result
}

/** The S256 code_challenge for a verifier: its SHA-256, base64url encoded without padding. */
export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const verifierBytes = new TextEncoder().encode(verifier) // Convert the verifier string to a Uint8Array of UTF-8 bytes.
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', verifierBytes)) // Compute the SHA-256 digest of the verifier bytes.
  const base64 = btoa(String.fromCharCode(...digest)) // Convert the digest bytes to a base64-encoded string.
  // Convert the base64 string to base64url without padding, as required by RFC 7636.
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

// Length of the verifier, the sign-in's secret. 43 is the RFC 7636 minimum.
const VERIFIER_LENGTH = 43
// Length of the state, the value checked on the callback to tell our sign-ins from forged ones
const STATE_LENGTH = 32

/** A fresh verifier, its challenge, and a state value, for one sign-in. */
export const createPkceChallenge = async (): Promise<PkceChallenge> => {
  const verifier = randomString(VERIFIER_LENGTH)
  return { verifier, challenge: await generateCodeChallenge(verifier), state: randomString(STATE_LENGTH) }
}

/**
 * Build the authorization request URL for the PKCE (S256) flow.
 *
 * The parameters required to build the authorization URL:
 *   - authorizationUrl: The base URL of the authorization endpoint.
 *   - clientId: The client ID of the application.
 *   - redirectUri: The URI to redirect to after authorization.
 *   - scope: The requested scopes.
 *   - state: The state value to include in the request.
 *   - codeChallenge: The PKCE code challenge.
 */
export const buildAuthorizeUrl = ({ authorizationUrl, clientId, redirectUri, scope, state, codeChallenge }: BuildAuthorizeUrlParams): string => {
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

/** The PKCE target for a scheme's authorizationCode flow, or undefined when it can't be used. */
export const buildPkceTarget = (scheme: IOauth2SecurityScheme, clientId: string): Oauth2PkceTarget | undefined => {
  const flow = scheme.flows?.authorizationCode
  // Spec endpoints are untrusted. Anything but absolute http(s) URLs, empty ones included, disables Authorize.
  if (!flow || !isOauth2AuthorizationCodeFlow(flow) || !isAbsoluteHttpUrl(flow.authorizationUrl) || !isAbsoluteHttpUrl(flow.tokenUrl)) {
    return undefined
  }

  const { authorizationUrl, tokenUrl, scopes } = flow
  return { schemeKey: scheme.key, authorizationUrl, tokenUrl, scopes: scopes || {}, fingerprint: `${authorizationUrl}|${tokenUrl}|${clientId}` }
}
