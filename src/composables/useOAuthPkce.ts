// Module-singleton state for the OAuth2 authorization code + PKCE sign-in in Try It.
// Tokens live in memory only, never in localStorage or sessionStorage, so an XSS bug elsewhere can't read them.
import { ref } from 'vue'
import { useTimeoutFn } from '@vueuse/core'
import { buildAuthorizeUrl, canUsePkce, createPkceChallenge, isAbsoluteHttpUrl } from '@/utils/oauth-pkce'
import { awaitAuthorizationResponse, FLOW_CANCELLED, openAuthorizationPopup } from '@/utils/oauth-popup'
// imported directly, the composables barrel imports this file
import useAuth from './useAuth'
import type { AuthorizeOptions, Oauth2AuthStatus, Oauth2PkceTarget, OauthToken, PkceChallenge, TokenResponseData } from '@/types'

/** How long before expiresAt a token already counts as expired. */
export const EXPIRY_SKEW_MS = 30_000
/** Give up on a token request the identity provider never answers. */
export const TOKEN_TIMEOUT_MS = 30_000

// worst first, see aggregateStatus
const STATUS_PRECEDENCE: Oauth2AuthStatus[] = ['authorizing', 'expired', 'unauthenticated', 'authenticated']

// all keyed by scheme key
const tokens = ref<Record<string, OauthToken>>({})
const busy = ref<Record<string, boolean>>({})
const errors = ref<Record<string, string | undefined>>({})
const challengeCache = new Map<string, PkceChallenge>()
const expiryTimers = new Map<string, () => void>()
// bumped when a token expires, so statusFor re-runs
const expiryTick = ref(0)
// cancels the sign-in in progress, only one runs at a time
let cancelActiveFlow: (() => void) | null = null

// TryItAuth builds the request headers from authInputs, so the token goes there, never straight into authHeadersMap.
const commitToken = (schemeKey: string): void => {
  const token = tokens.value[schemeKey]
  useAuth().authInputs.value[`${schemeKey}-token`] = token ? `${token.tokenType} ${token.accessToken}` : ''
}

const stopExpiryTimer = (schemeKey: string): void => {
  expiryTimers.get(schemeKey)?.()
  expiryTimers.delete(schemeKey)
}

const saveToken = (target: Oauth2PkceTarget, data: TokenResponseData): void => {
  const k = target.schemeKey
  const expiresAt = typeof data.expires_in === 'number' ? Date.now() + data.expires_in * 1000 : undefined
  tokens.value[k] = { accessToken: data.access_token, tokenType: data.token_type || 'Bearer', expiresAt, fingerprint: target.fingerprint }
  // a success replaces any error, including a rejected second click on this scheme
  errors.value[k] = undefined
  commitToken(k)

  stopExpiryTimer(k)
  if (expiresAt) {
    // only bumps the tick: the token stays, so the UI can show it as expired
    const { stop } = useTimeoutFn(() => {
      expiryTick.value++
    }, Math.max(0, expiresAt - EXPIRY_SKEW_MS - Date.now()))
    expiryTimers.set(k, stop)
  }
}

/** POST to the token endpoint. Throws with a user-facing message when that fails. */
const requestToken = async (tokenUrl: string, body: URLSearchParams): Promise<TokenResponseData> => {
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS)
  try {
    let resp: Response
    try {
      resp = await fetch(tokenUrl, {
        method: 'POST',
        cache: 'no-cache',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        // no client_secret or Basic auth header: a PKCE client is public by design
        body,
        signal: controller.signal,
      })
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        throw new Error('The token request timed out. Please try again.')
      }
      // No response at all means network or CORS. Never string-match err.message, it differs by browser.
      throw new Error(`Could not reach the token endpoint at ${new URL(tokenUrl).origin}. This is almost always CORS configuration on the identity provider, not a wrong Client ID. The token endpoint must answer the preflight OPTIONS request and return Access-Control-Allow-Origin: ${window.location.origin}, plus Access-Control-Allow-Methods: POST and Access-Control-Allow-Headers: Content-Type. The client must also be registered as a public/SPA client using PKCE. Check the Network tab for the failed request to ${tokenUrl}.`)
    }

    const data: Record<string, unknown> = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      // RFC 6749 error fields when the body has them
      const text = (value: unknown): string => typeof value === 'string' ? value : ''
      throw new Error(text(data.error_description) || text(data.error) || `The token endpoint responded with HTTP ${resp.status}.`)
    }
    if (typeof data.access_token !== 'string') {
      throw new Error('The token endpoint response did not include an access_token.')
    }
    return data as unknown as TokenResponseData
  } finally {
    clearTimeout(timeoutHandle)
  }
}

export default function useOAuthPkce() {
  // Getters never mutate: a token minted for other endpoints or another client id just reads as missing.
  const tokenFor = (target: Oauth2PkceTarget): OauthToken | undefined => {
    const token = tokens.value[target.schemeKey]
    return token?.fingerprint === target.fingerprint ? token : undefined
  }

  const statusFor = (target: Oauth2PkceTarget): Oauth2AuthStatus => {
    // read first, so a computed wrapping this re-runs when a token expires
    void expiryTick.value
    if (busy.value[target.schemeKey]) {
      return 'authorizing'
    }
    const token = tokenFor(target)
    if (!token) {
      return 'unauthenticated'
    }
    return token.expiresAt && token.expiresAt - EXPIRY_SKEW_MS <= Date.now() ? 'expired' : 'authenticated'
  }

  /** The worst status across the schemes of one security requirement. */
  const aggregateStatus = (targets: Oauth2PkceTarget[]): Oauth2AuthStatus => {
    const statuses = targets.map(statusFor)
    return STATUS_PRECEDENCE.find(status => statuses.includes(status)) ?? 'unauthenticated'
  }

  const errorFor = (target: Oauth2PkceTarget): string | undefined => errors.value[target.schemeKey]

  /** Hash a challenge ahead of time, so authorize() rarely waits on it. Best effort. */
  const precomputeChallenge = async (target: Oauth2PkceTarget): Promise<void> => {
    if (!canUsePkce()) {
      return
    }
    try {
      challengeCache.set(target.schemeKey, await createPkceChallenge())
    } catch {
      // authorize() makes its own
    }
  }

  const authorize = async ({ target, clientId, scopes, redirectUri }: AuthorizeOptions): Promise<void> => {
    const k = target.schemeKey
    const fail = (message: string): void => {
      errors.value[k] = message
    }

    // defence in depth, the Authorize button is disabled without these
    if (!redirectUri) {
      return fail('Set the oauthRedirectUri prop to enable OAuth sign-in.')
    }
    if (!canUsePkce()) {
      return fail('Signing in requires a secure context. Open this page over HTTPS (or localhost) to use OAuth.')
    }
    let redirect: URL
    try {
      redirect = new URL(redirectUri, window.location.href)
    } catch {
      return fail('The configured redirect URI is not a valid URL.')
    }
    if (!isAbsoluteHttpUrl(redirect.href)) {
      return fail('The configured redirect URI must use http or https.')
    }
    // buildPkceTarget already checks these, but a javascript: authorizationUrl would run in the same-origin popup
    if (!isAbsoluteHttpUrl(target.authorizationUrl) || !isAbsoluteHttpUrl(target.tokenUrl)) {
      return fail('The security scheme authorization or token URL is not a valid absolute http(s) URL.')
    }
    // One sign-in at a time. Rejecting, not superseding, stops an old flow's cleanup from resetting busy mid-flow.
    if (cancelActiveFlow) {
      return fail('A sign-in is already in progress. Finish or close it before starting another.')
    }

    // Open the popup before any await. Awaiting the hash first loses the click's user activation, so the popup gets blocked.
    const popup = openAuthorizationPopup()
    if (!popup) {
      return fail('Your browser blocked the sign-in window. Allow pop-ups for this site and try again.')
    }

    // Register before the first await, so a double click during the hash still sees this flow.
    const { promise, cancel } = awaitAuthorizationResponse(popup, redirect.origin)
    // awaited below, this stops an early exit from leaving an unhandled rejection
    promise.catch(() => {})
    cancelActiveFlow = cancel
    errors.value[k] = undefined
    busy.value[k] = true

    try {
      const challenge = challengeCache.get(k) ?? await createPkceChallenge()
      // replace, not href: no history entry, and it still works once the popup is cross-origin
      popup.location.replace(buildAuthorizeUrl({
        authorizationUrl: target.authorizationUrl,
        clientId,
        redirectUri: redirect.href,
        scope: scopes.join(' '),
        state: challenge.state,
        codeChallenge: challenge.challenge,
      }))

      const params = await promise
      // check state first, a mismatch never reaches the token endpoint
      if (params.state !== challenge.state) {
        throw new Error('Sign-in could not be verified (state mismatch) and was cancelled. Please try again.')
      }
      if (params.error) {
        throw new Error(params.error === 'access_denied' ? 'Access was denied at the identity provider.' : params.errorDescription || params.error)
      }
      if (!params.code) {
        throw new Error('The identity provider did not return an authorization code.')
      }

      saveToken(target, await requestToken(target.tokenUrl, new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code: params.code,
        redirect_uri: redirect.href,
        code_verifier: challenge.verifier,
      })))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // a cancel from code isn't the user's error
      if (message !== FLOW_CANCELLED) {
        errors.value[k] = message
      }
      // stops the listener and timers, and closes the popup
      cancel()
    } finally {
      busy.value[k] = false
      // single use, whatever the outcome
      challengeCache.delete(k)
      // only clear it if it's still this flow's, a test reset may have started another since
      if (cancelActiveFlow === cancel) {
        cancelActiveFlow = null
      }
    }
  }

  const clearCredentials = (target: Oauth2PkceTarget): void => {
    const k = target.schemeKey
    delete tokens.value[k]
    errors.value[k] = undefined
    challengeCache.delete(k)
    stopExpiryTimer(k)
    commitToken(k)
  }

  /** Forget every token and error, and cancel a sign-in in progress. */
  const reset = (): void => {
    cancelActiveFlow?.()
    cancelActiveFlow = null
    tokens.value = {}
    busy.value = {}
    errors.value = {}
    expiryTick.value = 0
    challengeCache.clear()
    for (const stop of expiryTimers.values()) {
      stop()
    }
    expiryTimers.clear()
  }

  return { statusFor, aggregateStatus, tokenFor, errorFor, precomputeChallenge, authorize, clearCredentials, reset }
}
