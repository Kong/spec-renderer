// Module-singleton state machine for the OAuth2 authorization-code-with-PKCE Try-It flow.
// Never touches localStorage or sessionStorage - tokens live in memory only, so an XSS bug elsewhere can't read a persisted bearer token.
import { ref } from 'vue'
import { useTimeoutFn } from '@vueuse/core'
import {
  buildAuthorizeUrl,
  canUsePkce,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from '@/utils/oauth-pkce'
import {
  awaitAuthorizationResponse,
  navigateAuthorizationPopup,
  openAuthorizationPopup,
} from '@/utils/oauth-popup'
import useAuth from './useAuth'
import type {
  ActiveAuthorizationFlow,
  AuthorizationResponseParams,
  AuthorizeOptions,
  Oauth2AuthError,
  Oauth2AuthStatus,
  Oauth2PkceTarget,
  OauthToken,
  PkceChallenge,
  TokenRequestResult,
  TokenResponseData,
} from '@/types'

/** How far ahead of `expiresAt` a token is treated as already expired. */
export const EXPIRY_SKEW_MS = 30_000
/** Abort the token/refresh request if the identity provider never responds. */
export const TOKEN_TIMEOUT_MS = 30_000

// Worst-wins precedence for `aggregateStatus`.
const STATUS_PRECEDENCE: Oauth2AuthStatus[] = ['authorizing', 'expired', 'unauthenticated', 'authenticated']

const tokens = ref<Record<string, OauthToken>>({}) // keyed by scheme key
const busy = ref<Record<string, boolean>>({})
const errors = ref<Record<string, Oauth2AuthError | undefined>>({})
const expiryTick = ref<number>(0)

// non-reactive module state
let activeFlow: ActiveAuthorizationFlow | null = null
const challengeCache = new Map<string, PkceChallenge>() // keyed by scheme key
const refreshInFlight = new Map<string, Promise<boolean>>()
const expiryTimers = new Map<string, () => void>() // scheme key -> stop fn

// Keyed by scheme key. OauthToken is a fixed, shared type this module must not reshape, so the client id needed for silent refresh() is tracked here instead.
const clientIds = new Map<string, string>()

/**
 * POST a token/refresh request and interpret the result.
 * Discriminates on whether we got a Response at all: non-ok HTTP is an 'oauth' error (RFC 6749), a fetch that throws before any Response is a 'network' error (usually CORS, not a bad client id).
 */
const requestToken = async (tokenUrl: string, body: URLSearchParams): Promise<TokenRequestResult> => {
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
        // No client_secret or Authorization: Basic header, this is a public client by design; PKCE means it never needs one.
        body,
        signal: controller.signal,
      })
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return { ok: false, error: { kind: 'timeout', message: 'The token request timed out. Please try again.' } }
      }

      // No Response ever existed, so this is network/CORS not an HTTP error. Never string-match err.message, it differs by browser and version.
      const tokenOrigin = new URL(tokenUrl).origin
      const localOrigin = typeof window !== 'undefined' ? window.location.origin : ''
      return {
        ok: false,
        error: {
          kind: 'network',
          tokenUrl,
          message: `Could not reach the token endpoint at ${tokenOrigin}. This is almost always CORS configuration on the identity provider, not a wrong Client ID. The token endpoint must answer the preflight OPTIONS request and return Access-Control-Allow-Origin: ${localOrigin}, plus Access-Control-Allow-Methods: POST and Access-Control-Allow-Headers: Content-Type. The client must also be registered as a public/SPA client using PKCE. Check the Network tab for the failed request to ${tokenUrl}.`,
        },
      }
    }

    if (!resp.ok) {
      let error: string | undefined
      let errorDescription: string | undefined
      try {
        const errData = await resp.json()
        error = typeof errData?.error === 'string' ? errData.error : undefined
        errorDescription = typeof errData?.error_description === 'string' ? errData.error_description : undefined
      } catch {
        // Error body wasn't JSON (or was empty/absent) - fall through with no RFC 6749 detail.
      }

      return {
        ok: false,
        error: {
          kind: 'oauth',
          error,
          errorDescription,
          message: errorDescription || error || `The token endpoint responded with HTTP ${resp.status}.`,
        },
      }
    }

    let data: Record<string, unknown>
    try {
      data = await resp.json()
    } catch {
      return { ok: false, error: { kind: 'invalid-response', message: 'The token endpoint returned a response that could not be parsed as JSON.' } }
    }

    if (typeof data?.access_token !== 'string') {
      return { ok: false, error: { kind: 'invalid-response', message: 'The token endpoint response did not include an access_token.' } }
    }

    return { ok: true, data: data as unknown as TokenResponseData }
  } finally {
    clearTimeout(timeoutHandle)
  }
}

/**
 * TryItAuth's updateAuthDataImpl assembles authHeadersMap/authQueryMap from authInputs under the GROUP key, not the scheme key.
 * So this module only ever sets authInputs, same as the clientCredentials flow in TryItAuth2, never authHeadersMap directly.
 */
const commitToken = (target: Oauth2PkceTarget): void => {
  const token = tokens.value[target.schemeKey]
  const { authInputs } = useAuth()
  authInputs.value[`${target.schemeKey}-token`] = token ? `${token.tokenType} ${token.accessToken}` : ''
}

/**
 * Arm a one-shot timer that bumps expiryTick when the token crosses the expiry skew.
 * Doesn't blank the token, it (and its refreshToken) must survive expiry so refresh() can still run; bumping expiryTick is enough for statusFor to re-evaluate.
 */
const armExpiryTimer = (target: Oauth2PkceTarget): void => {
  const token = tokens.value[target.schemeKey]

  expiryTimers.get(target.schemeKey)?.()
  expiryTimers.delete(target.schemeKey)

  if (!token?.expiresAt) {
    return
  }

  const delay = Math.max(0, token.expiresAt - EXPIRY_SKEW_MS - Date.now())

  const { stop } = useTimeoutFn(() => {
    expiryTick.value++
  }, delay)

  expiryTimers.set(target.schemeKey, stop)
}

/** Exchange an authorization code for a token and commit it to state on success. */
const exchangeCode = async (
  target: Oauth2PkceTarget,
  code: string,
  verifier: string,
  redirectUri: string,
  clientId: string,
): Promise<void> => {
  const k = target.schemeKey

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  })

  const result = await requestToken(target.tokenUrl, body)

  if (!result.ok) {
    errors.value[k] = result.error
    return
  }

  const { data } = result
  const token: OauthToken = {
    accessToken: data.access_token,
    tokenType: data.token_type || 'Bearer',
    refreshToken: data.refresh_token,
    expiresAt: typeof data.expires_in === 'number' ? Date.now() + data.expires_in * 1000 : undefined,
    scope: data.scope,
    fingerprint: target.fingerprint,
  }

  tokens.value[k] = token
  clientIds.set(k, clientId)
  errors.value[k] = undefined
  armExpiryTimer(target)
  commitToken(target)
}

export default function useOAuthPkce() {

  const statusFor = (target: Oauth2PkceTarget): Oauth2AuthStatus => {
    // Read first so a `computed` wrapping this re-evaluates when an expiry timer fires.
    void expiryTick.value

    if (busy.value[target.schemeKey]) {
      return 'authorizing'
    }

    const token = tokens.value[target.schemeKey]
    if (!token || token.fingerprint !== target.fingerprint) {
      return 'unauthenticated'
    }

    if (token.expiresAt && token.expiresAt - EXPIRY_SKEW_MS <= Date.now()) {
      return 'expired'
    }

    return 'authenticated'
  }

  const aggregateStatus = (targets: Oauth2PkceTarget[]): Oauth2AuthStatus => {
    if (targets.length === 0) {
      return 'unauthenticated'
    }

    const statuses = targets.map(statusFor)
    for (const status of STATUS_PRECEDENCE) {
      if (statuses.includes(status)) {
        return status
      }
    }

    return 'unauthenticated'
  }

  const tokenFor = (target: Oauth2PkceTarget): OauthToken | undefined => {
    const token = tokens.value[target.schemeKey]
    // Getters must not mutate. A fingerprint mismatch (e.g. the spec's client id changed) just reports no token, it never deletes the stale one.
    if (!token || token.fingerprint !== target.fingerprint) {
      return undefined
    }
    return token
  }

  const errorFor = (target: Oauth2PkceTarget): Oauth2AuthError | undefined => errors.value[target.schemeKey]


  const precomputeChallenge = async (target: Oauth2PkceTarget): Promise<void> => {
    if (!canUsePkce()) {
      return
    }

    try {
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)
      const state = generateState()
      challengeCache.set(target.schemeKey, { verifier, challenge, state })
    } catch {
      // Best-effort warm-up so authorize() can stay synchronous up to window.open. Failure here just means authorize() generates its own challenge; never surfaced to the user.
    }
  }

  const authorize = async (opts: AuthorizeOptions): Promise<void> => {
    const { target, clientId, scopes, redirectUri } = opts
    const k = target.schemeKey

    // 1. Defence in depth - the Authorize button is normally disabled without a redirect URI.
    if (!redirectUri) {
      errors.value[k] = { kind: 'oauth', message: 'Set the oauthRedirectUri prop to enable OAuth sign-in.' }
      return
    }

    // 2. No popup at all if PKCE crypto isn't available.
    if (!canUsePkce()) {
      errors.value[k] = {
        kind: 'unsupported-crypto',
        message: 'Signing in requires a secure context. Open this page over HTTPS (or localhost) to use OAuth.',
      }
      return
    }

    // 3. Resolve to absolute and reject any non-http(s) scheme.
    let resolved: URL
    try {
      resolved = new URL(redirectUri, window.location.href)
    } catch {
      errors.value[k] = { kind: 'oauth', message: 'The configured redirect URI is not a valid URL.' }
      return
    }

    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      errors.value[k] = { kind: 'oauth', message: 'The configured redirect URI must use http or https.' }
      return
    }

    const expectedOrigin = resolved.origin

    // 4. Supersede any flow already in progress for this scheme, and reset for this one.
    activeFlow?.cancel()
    errors.value[k] = undefined
    busy.value[k] = true

    // 5. Open the popup SYNCHRONOUSLY, before any await below.
    // crypto.subtle.digest (used to derive the PKCE challenge) is async; awaiting it first loses the click's user-activation, so Safari blocks the popup outright and Firefox intermittently.
    const popup = openAuthorizationPopup()
    if (!popup) {
      errors.value[k] = {
        kind: 'popup-blocked',
        message: 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.',
      }
      busy.value[k] = false
      return
    }

    // 6. It is safe to await from here on.
    let flow: typeof activeFlow = null
    try {
      const cached = challengeCache.get(k)
      const challenge: PkceChallenge = cached ?? await (async (): Promise<PkceChallenge> => {
        const verifier = generateCodeVerifier()
        return { verifier, challenge: await generateCodeChallenge(verifier), state: generateState() }
      })()

      const authorizeUrl = buildAuthorizeUrl({
        authorizationUrl: target.authorizationUrl,
        clientId,
        redirectUri: resolved.href,
        scope: scopes.join(' '),
        state: challenge.state,
        codeChallenge: challenge.challenge,
      })

      navigateAuthorizationPopup(popup, authorizeUrl)

      const { promise, cancel } = awaitAuthorizationResponse(popup, expectedOrigin)
      flow = { schemeKey: k, state: challenge.state, cancel }
      activeFlow = flow

      let params: AuthorizationResponseParams
      try {
        params = await promise
      } catch (err) {
        const message = (err as Error)?.message
        if (message === 'popup-closed') {
          let popupClosedMessage = 'The sign-in window closed before returning an authorization code. If the identity provider showed an error, the redirect URI is most likely not registered for this client.'
          if (window.crossOriginIsolated === true) {
            popupClosedMessage += ' This page sets a Cross-Origin-Opener-Policy that prevents the sign-in window from communicating back; it must be served with Cross-Origin-Opener-Policy: same-origin-allow-popups.'
          }
          errors.value[k] = { kind: 'popup-closed', message: popupClosedMessage }
        } else if (message === 'timeout') {
          errors.value[k] = { kind: 'timeout', message: 'Sign-in timed out. Please try again.' }
        } else if (message === 'cancelled') {
          // A newer flow superseded this one - not a user-facing error.
          errors.value[k] = undefined
        } else {
          errors.value[k] = { kind: 'oauth', message: message || 'Sign-in failed.' }
        }
        return
      }

      // 9. Validate state before doing anything else - no token request on mismatch.
      if (params.state !== challenge.state) {
        errors.value[k] = { kind: 'state-mismatch', message: 'Sign-in could not be verified (state mismatch) and was cancelled. Please try again.' }
        return
      }

      if (params.error) {
        errors.value[k] = params.error === 'access_denied'
          ? { kind: 'user-denied', message: 'Access was denied at the identity provider.' }
          : {
            kind: 'oauth',
            error: params.error,
            errorDescription: params.errorDescription,
            message: params.errorDescription || params.error,
          }
        return
      }

      if (!params.code) {
        errors.value[k] = { kind: 'oauth', message: 'The identity provider did not return an authorization code.' }
        return
      }

      // 10. Exchange the code.
      await exchangeCode(target, params.code, challenge.verifier, resolved.href, clientId)
    } finally {
      busy.value[k] = false
      // The challenge is single-use regardless of outcome.
      challengeCache.delete(k)
      // Compare by reference not scheme key - a newer authorize() call may have installed its own activeFlow by the time this finally runs, don't clobber it.
      if (flow && activeFlow === flow) {
        activeFlow = null
      }
    }
  }

  const clearCredentials = (target: Oauth2PkceTarget): void => {
    const k = target.schemeKey

    delete tokens.value[k]
    errors.value[k] = undefined
    clientIds.delete(k)
    challengeCache.delete(k)

    expiryTimers.get(k)?.()
    expiryTimers.delete(k)

    // No token now, so the combined-header assembly in TryItAuth must stop seeing one.
    commitToken(target)
  }

  /**
   * Refresh the token for target. Single-flight per scheme key for correctness, not perf - with refresh-token rotation, two concurrent refreshes would each present the same superseded token and the loser gets rejected, killing the whole session.
   * Never opens a popup or navigates; a failed refresh just clears credentials so the user re-authorizes.
   */
  const refresh = (target: Oauth2PkceTarget): Promise<boolean> => {
    const k = target.schemeKey

    const inFlight = refreshInFlight.get(k)
    if (inFlight) {
      return inFlight
    }

    const run = async (): Promise<boolean> => {
      const token = tokens.value[k]
      if (!token || token.fingerprint !== target.fingerprint || !token.refreshToken) {
        return false
      }

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
        client_id: clientIds.get(k) || '',
      })
      if (token.scope) {
        body.set('scope', token.scope)
      }

      const result = await requestToken(target.refreshUrl || target.tokenUrl, body)

      if (!result.ok) {
        clearCredentials(target)
        errors.value[k] = { kind: 'oauth', message: 'Your session expired. Click Authorize to sign in again.' }
        return false
      }

      const { data } = result
      const newToken: OauthToken = {
        accessToken: data.access_token,
        tokenType: data.token_type || 'Bearer',
        // Rotation is optional - keep the previous refresh token when the server omits one.
        refreshToken: data.refresh_token || token.refreshToken,
        expiresAt: typeof data.expires_in === 'number' ? Date.now() + data.expires_in * 1000 : undefined,
        scope: data.scope || token.scope,
        fingerprint: target.fingerprint,
      }

      tokens.value[k] = newToken
      errors.value[k] = undefined
      armExpiryTimer(target)
      commitToken(target)
      return true
    }

    const promise = run().finally(() => {
      refreshInFlight.delete(k)
    })
    refreshInFlight.set(k, promise)
    return promise
  }

  /** Test-only: reset every piece of module state. Never call this from application code. */
  const __resetForTests = (): void => {
    tokens.value = {}
    busy.value = {}
    errors.value = {}
    expiryTick.value = 0

    activeFlow?.cancel()
    activeFlow = null

    challengeCache.clear()
    refreshInFlight.clear()

    for (const stop of expiryTimers.values()) {
      stop()
    }
    expiryTimers.clear()

    clientIds.clear()
  }

  return {
    statusFor,
    aggregateStatus,
    tokenFor,
    errorFor,
    precomputeChallenge,
    authorize,
    refresh,
    clearCredentials,
    __resetForTests,
  }
}
