import type { HttpSecurityScheme } from '@stoplight/types'

export interface SecuritySchemeGroup {
  title: string
  key: string
  schemeList: HttpSecurityScheme[]
}

/** Lifecycle state of an OAuth 2.0 authorization-code (PKCE) session for one security scheme. */
export type Oauth2AuthStatus = 'unauthenticated' | 'authorizing' | 'authenticated' | 'expired'

/**
 * Everything the PKCE flow needs about one `authorizationCode` security scheme,
 * flattened out of the OpenAPI flow object so the flow logic never re-reads the spec.
 */
export interface Oauth2PkceTarget {
  schemeKey: string
  authorizationUrl: string
  tokenUrl: string
  refreshUrl?: string
  scopes: Record<string, string>
  /** `authorizationUrl|tokenUrl|clientId` - guards against a spec swap reusing another spec's token. */
  fingerprint: string
}

/** An access token held in memory. Never persisted to browser storage. */
export interface OauthToken {
  accessToken: string
  tokenType: string
  refreshToken?: string
  /** Epoch ms. Undefined when the server sent no `expires_in`, which means "never expires". */
  expiresAt?: number
  scope?: string
  fingerprint: string
}

export type Oauth2AuthErrorKind =
  | 'network'
  | 'oauth'
  | 'invalid-response'
  | 'timeout'
  | 'state-mismatch'
  | 'popup-blocked'
  | 'popup-closed'
  | 'user-denied'
  | 'unsupported-crypto'

export interface Oauth2AuthError {
  kind: Oauth2AuthErrorKind
  message: string
  /** Set for `kind: 'network'` so the CORS guidance can name the endpoint. */
  tokenUrl?: string
  /** RFC 6749 `error` / `error_description`, set for `kind: 'oauth'`. */
  error?: string
  errorDescription?: string
}

/** Result of the pre-request auth step run before a Try-It call goes out. */
export interface AuthPreflightResult {
  ok: boolean
  response?: Response
  error?: Error
}

/**
 * A flow component's pre-request hook. `undefined` means "nothing to do".
 * A bare `Response` is the legacy clientCredentials shape and is treated as ok when `response.ok`.
 */
export type AuthPreflightHandler = () =>
  | Promise<Response | AuthPreflightResult | undefined>
  | Response
  | AuthPreflightResult
  | undefined

/** Parameters the authorization server returns to the callback page. */
export interface AuthorizationResponseParams {
  code?: string
  state?: string
  error?: string
  errorDescription?: string
}

/** A precomputed PKCE challenge triple. */
export interface PkceChallenge {
  verifier: string
  challenge: string
  state: string
}
