// OAuth2 PKCE (RFC 7636) helpers, with no dependencies.
// Never fall back to code_challenge_method=plain or Math.random(), fail instead.

import { isOauth2AuthorizationCodeFlow } from '@/stoplight/elements-core/utils/oas/security'
import type { IOauth2SecurityScheme } from '@stoplight/types'
import type { BuildAuthorizeUrlParams, Oauth2PkceTarget, PkceChallenge } from '@/types'

// 64 of the 66 RFC 7636 unreserved characters. 64 divides 256, so `byte & 63` is uniform, a `% 66` would not be.
const RANDOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
// RFC 7636 minimum, 258 bits of randomness
const VERIFIER_LENGTH = 43
const STATE_LENGTH = 32

/** True when the Web Crypto parts PKCE needs exist. Doesn't use window.isSecureContext, it's undefined in jsdom. */
export const canUsePkce = (): boolean =>
  typeof globalThis.crypto?.getRandomValues === 'function' && typeof globalThis.crypto?.subtle?.digest === 'function'

/** True when raw is an absolute http(s) URL. Spec endpoints are untrusted, a javascript: URL would run in the popup. */
export const isAbsoluteHttpUrl = (raw: string): boolean => {
  try {
    const { protocol } = new URL(raw)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

const randomString = (length: number): string => {
  let result = ''
  for (const byte of globalThis.crypto.getRandomValues(new Uint8Array(length))) {
    result += RANDOM_ALPHABET[byte & 63]
  }
  return result
}

/** The S256 code_challenge for a verifier: its SHA-256, base64url encoded without padding. */
export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
  return btoa(String.fromCharCode(...digest)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

/** A fresh verifier, its challenge, and a state value, for one sign-in. */
export const createPkceChallenge = async (): Promise<PkceChallenge> => {
  const verifier = randomString(VERIFIER_LENGTH)
  return { verifier, challenge: await generateCodeChallenge(verifier), state: randomString(STATE_LENGTH) }
}

/** The authorization request URL for the PKCE (S256) flow. */
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
export const buildPkceTarget = (schemeKey: string, scheme: IOauth2SecurityScheme, clientId: string): Oauth2PkceTarget | undefined => {
  const flow = scheme.flows?.authorizationCode
  // Spec endpoints are untrusted. Anything but absolute http(s) URLs, empty ones included, disables Authorize.
  if (!flow || !isOauth2AuthorizationCodeFlow(flow) || !isAbsoluteHttpUrl(flow.authorizationUrl) || !isAbsoluteHttpUrl(flow.tokenUrl)) {
    return undefined
  }

  const { authorizationUrl, tokenUrl, scopes } = flow
  return { schemeKey, authorizationUrl, tokenUrl, scopes: scopes || {}, fingerprint: `${authorizationUrl}|${tokenUrl}|${clientId}` }
}
