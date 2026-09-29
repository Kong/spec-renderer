/** Sign-in state of one authorizationCode (PKCE) security scheme. */
export type Oauth2AuthStatus = 'unauthenticated' | 'authorizing' | 'authenticated' | 'expired'

/** What the PKCE flow needs from one authorizationCode security scheme. */
export interface Oauth2PkceTarget {
  schemeKey: string
  authorizationUrl: string
  tokenUrl: string
  scopes: Record<string, string>
  /** `authorizationUrl|tokenUrl|clientId`, so a token is never reused for another spec or client */
  fingerprint: string
}

/** An access token, held in memory only. */
export interface OauthToken {
  accessToken: string
  tokenType: string
  /** epoch ms, undefined when the server sent no expires_in */
  expiresAt?: number
  fingerprint: string
}

/** What the callback page posts back from the identity provider. */
export interface AuthorizationResponseParams {
  code?: string
  state?: string
  error?: string
  errorDescription?: string
}

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
}

export interface AwaitAuthorizationResponseResult {
  promise: Promise<AuthorizationResponseParams>
  cancel: () => void
}

/** What starting a sign-in needs: the scheme, the user's client id and scopes, and the callback page. */
export interface AuthorizeOptions {
  target: Oauth2PkceTarget
  clientId: string
  scopes: string[]
  redirectUri: string
}

/** The parts of the token endpoint's JSON body (RFC 6749) this flow reads. */
export interface TokenResponseData {
  access_token: string
  token_type?: string
  expires_in?: number
}
