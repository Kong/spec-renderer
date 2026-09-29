// Module-singleton state for the OAuth2 authorization code + PKCE sign-in in Try It.
// Tokens live in memory only, never in localStorage or sessionStorage, so an XSS bug elsewhere can't read them.
import { ref } from 'vue'
import { useTimeoutFn } from '@vueuse/core'
import { buildAuthorizeUrl, canUsePkce, createPkceChallenge, isAbsoluteHttpUrl } from '@/utils/oauth-pkce'
import { awaitAuthorizationResponse, FLOW_CANCELLED, openAuthorizationPopup } from '@/utils/oauth-popup'
import useAuth from './useAuth'
import type { AuthorizeOptions, Oauth2AuthStatus, Oauth2PkceTarget, OauthToken, TokenResponseData } from '@/types'

/** Treat tokens as expired a bit earlier, to account for network latency and to ensure in-flight requests don't 401 */
export const EXPIRY_SKEW_MS = 30_000
/** Give up on a token request the identity provider never answers. */
export const TOKEN_TIMEOUT_MS = 30_000

// worst first, see aggregateStatus
const STATUS_PRECEDENCE: Oauth2AuthStatus[] = ['authorizing', 'expired', 'unauthenticated', 'authenticated']

// all maps below are keyed by scheme key
/** Access tokens from completed sign-ins. Retained even after expiry so the UI can show them as expired. */
const tokens = ref<Record<string, OauthToken>>({})
/** True while a sign-in for that scheme is in progress. */
const busy = ref<Record<string, boolean>>({})
/** The last user-facing sign-in error, cleared on the next attempt or success. */
const errors = ref<Record<string, string | undefined>>({})
/** Cancels each token's pending expiry timer, so a replaced or cleared token's timer never fires. */
const expiryTimers = new Map<string, () => void>()
// bumped when a token expires, so statusFor re-runs
const expiryTick = ref<number>(0)
// cancels the active sign-in in progress, ensures only one runs at a time
let cancelActiveFlow: (() => void) | null = null

/** Copy the scheme's token into authInputs, which TryItAuth builds request headers from. Never write authHeadersMap directly. */
const commitToken = (schemeKey: string): void => {
  const token = tokens.value[schemeKey]
  useAuth().authInputs.value[`${schemeKey}-token`] = token ? `${token.tokenType} ${token.accessToken}` : ''
}

/**
 * Cancel the scheme's pending expiry timer, if one exists.
 * This ensures that a replaced or cleared token's timer never fires.
 */
const stopExpiryTimer = (schemeKey: string): void => {
  expiryTimers.get(schemeKey)?.()
  expiryTimers.delete(schemeKey)
}

/** Store a token response, pass it to Try It, and schedule its expiry. */
const saveToken = ({ schemeKey, fingerprint }: Oauth2PkceTarget, { expires_in, access_token, token_type }: TokenResponseData): void => {
  const expiresAt = typeof expires_in === 'number' ? Date.now() + expires_in * 1000 : undefined
  tokens.value[schemeKey] = {
    accessToken: access_token,
    tokenType: token_type || 'Bearer',
    expiresAt,
    fingerprint: fingerprint,
  }
  // a success replaces any error, including a rejected second click on this scheme
  errors.value[schemeKey] = undefined
  commitToken(schemeKey)
  stopExpiryTimer(schemeKey)

  // schedule a timer to mark token as expired in UI
  if (expiresAt) {
    const { stop } = useTimeoutFn(() => {
      expiryTick.value++ // triggers recompute of any UI elements dependent on token expiry
    }, Math.max(0, expiresAt - EXPIRY_SKEW_MS - Date.now())) // set for 30s before expiry
    expiryTimers.set(schemeKey, stop)
  }
}

/** POST to the token endpoint. Throws with a user-facing message when that fails. */
const requestToken = async (tokenUrl: string, body: URLSearchParams): Promise<TokenResponseData> => {
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS) // abort the request if it takes too long

  // two-level try: outer for timeout cleanup, inner for fetch and network errors
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
      throw new Error(`Unable to reach the token endpoint at ${new URL(tokenUrl).origin}.`)
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

/** OAuth2 PKCE sign-in for Try It. Every caller shares the same module-level state. */
export default function useOAuthPkce() {

  /** The scheme's token, or undefined if it was minted for a different fingerprint. */
  const tokenFor = (target: Oauth2PkceTarget): OauthToken | undefined => {
    const token = tokens.value[target.schemeKey]
    return token?.fingerprint === target.fingerprint ? token : undefined
  }

  /** The sign-in status of one scheme. Re-runs when a token expires. */
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

  /** The highest precedence status across the schemes of one security requirement. */
  const aggregateStatus = (targets: Oauth2PkceTarget[]): Oauth2AuthStatus => {
    const statuses = targets.map(statusFor)
    return STATUS_PRECEDENCE.find(status => statuses.includes(status)) ?? 'unauthenticated'
  }

  /** The last sign-in error for the scheme, if any. */
  const errorFor = (target: Oauth2PkceTarget): string | undefined => errors.value[target.schemeKey]

  /** Sign in via authorization code + PKCE in a popup and store the token. Reports failures through errorFor instead of throwing. */
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
      const challenge = await createPkceChallenge()
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
      // only clear it if it's still this flow's, a test reset may have started another since
      if (cancelActiveFlow === cancel) {
        cancelActiveFlow = null
      }
    }
  }

  /** Sign out of one scheme and remove its token from Try It requests. */
  const clearCredentials = (target: Oauth2PkceTarget): void => {
    const k = target.schemeKey
    delete tokens.value[k]
    errors.value[k] = undefined
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
    for (const stop of expiryTimers.values()) {
      stop()
    }
    expiryTimers.clear()
  }

  return { statusFor, aggregateStatus, tokenFor, errorFor, authorize, clearCredentials, reset }
}
