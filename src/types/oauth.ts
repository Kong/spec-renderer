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

export interface AwaitAuthorizationResponseOptions {
  timeoutMs?: number
  pollMs?: number
}

export interface AwaitAuthorizationResponseResult {
  promise: Promise<AuthorizationResponseParams>
  cancel: () => void
}

/** The sign-in currently in progress. Only one popup flow runs at a time. */
export interface ActiveAuthorizationFlow {
  schemeKey: string
  state: string
  cancel: () => void
}

/** What starting a sign-in needs: the scheme, the user's client id and scopes, and the callback page. */
export interface AuthorizeOptions {
  target: Oauth2PkceTarget
  clientId: string
  scopes: string[]
  redirectUri: string
}

/** The token endpoint's JSON body, as defined by RFC 6749. */
export interface TokenResponseData {
  access_token: string
  token_type?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
}

export type TokenRequestResult =
  | { ok: true, data: TokenResponseData }
  | { ok: false, error: Oauth2AuthError }
