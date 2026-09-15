// Module-singleton state machine for the OAuth2 authorization-code-with-PKCE Try-It flow.
//
// Deliberately touches neither `localStorage` nor `sessionStorage` anywhere in this file -
// tokens live in memory only, for the lifetime of the page. This is a security choice, not
// an oversight: persisting a bearer token to browser storage would survive a page reload
// and be readable by any script that can reach the same origin (e.g. via an XSS bug
// elsewhere on the host page).
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
// Import `useAuth` directly rather than via the `@/composables` barrel: that barrel
// (`src/composables/index.ts`) imports this module, so importing it back here would be a
// circular import.
import useAuth from './useAuth'
import type {
  AuthorizationResponseParams,
  Oauth2AuthError,
  Oauth2AuthStatus,
  Oauth2PkceTarget,
  OauthToken,
  PkceChallenge,
} from '@/types'

// ─── Constants ─────────────────────────────────────────────────────────────────

/** How far ahead of `expiresAt` a token is treated as already expired. */
export const EXPIRY_SKEW_MS = 30_000
/** How far ahead of `expiresAt` a caller should proactively call `refresh()`. Not used
 *  internally by this module - exported for the Try-It UI to decide when to refresh. */
export const REFRESH_SKEW_MS = 60_000
/** Abort the token/refresh request if the identity provider never responds. */
export const TOKEN_TIMEOUT_MS = 30_000

// Worst-wins precedence for `aggregateStatus`.
const STATUS_PRECEDENCE: Oauth2AuthStatus[] = ['authorizing', 'expired', 'unauthenticated', 'authenticated']

// ─── Module-scope state (singleton across the whole app/page) ──────────────────

const tokens = ref<Record<string, OauthToken>>({}) // keyed by scheme key
const busy = ref<Record<string, boolean>>({})
const errors = ref<Record<string, Oauth2AuthError | undefined>>({})
const expiryTick = ref(0)

// non-reactive module state
let activeFlow: { schemeKey: string, state: string, cancel: () => void } | null = null
const challengeCache = new Map<string, PkceChallenge>() // keyed by scheme key
const refreshInFlight = new Map<string, Promise<boolean>>()
const expiryTimers = new Map<string, () => void>() // scheme key -> stop fn

// Keyed by scheme key - the client id a token was minted with. `OauthToken` is a fixed,
// shared type (see `@/types/security.ts`) that this module must not reshape, so the
// client id needed later for silent `refresh()` is tracked here instead of on the token.
const clientIds = new Map<string, string>()

// ─── Token request (shared by code exchange and refresh) ───────────────────────

interface TokenResponseData {
  access_token: string
  token_type?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
}

type TokenRequestResult =
  | { ok: true, data: TokenResponseData }
  | { ok: false, error: Oauth2AuthError }

/**
 * POST a token/refresh request and interpret the result.
 *
 * The discriminator throughout is "did we ever get a `Response` at all": a non-ok HTTP
 * response is an `'oauth'` error (RFC 6749 `error`/`error_description`), while a `fetch`
 * that throws before producing any `Response` is a `'network'` error (almost always a
 * CORS misconfiguration on the identity provider, not a bad client id).
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
        // No `client_secret`, no `Authorization: Basic` header - this is a public client
        // by design. PKCE exists specifically so a public client (one that cannot keep a
        // secret, like a browser-hosted docs page) doesn't need one.
        body,
        signal: controller.signal,
      })
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return { ok: false, error: { kind: 'timeout', message: 'The token request timed out. Please try again.' } }
      }

      // No `Response` ever existed, so this is a network/CORS-layer failure rather than
      // an HTTP error response. Never string-match `err.message` here - it differs by
      // browser ('Failed to fetch' in Chrome, 'Load failed' in Safari, 'NetworkError
      // when attempting to fetch resource.' in Firefox) and can change between versions.
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

// ─── Internal helpers ───────────────────────────────────────────────────────────

/**
 * The active security requirement's combined headers are assembled by
 * `TryItAuth.vue`'s `updateAuthDataImpl()`, which reads the token out of `authInputs`
 * and writes `authHeadersMap`/`authQueryMap` under the GROUP key (not the scheme key).
 * Writing `authHeadersMap` directly from here would be clobbered on that function's next
 * debounced run, and would miss multi-scheme AND groups entirely - so this module only
 * ever sets `authInputs`, exactly like the clientCredentials flow in `TryItAuth2.vue`
 * (`authInputs.value[\`${schemeKey}-token\`] = \`${tokenType} ${accessToken}\``).
 */
const commitToken = (target: Oauth2PkceTarget): void => {
  const token = tokens.value[target.schemeKey]
  const { authInputs } = useAuth()
  authInputs.value[`${target.schemeKey}-token`] = token ? `${token.tokenType} ${token.accessToken}` : ''
}

/**
 * Arm a one-shot timer that bumps `expiryTick` when the token crosses the expiry skew.
 *
 * Unlike the clientCredentials pattern this deliberately does NOT blank the token: the
 * token (and, critically, its `refreshToken`) must survive expiry so silent `refresh()`
 * can still run afterward. Bumping `expiryTick` is enough to make `statusFor` re-evaluate.
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

// ─── Public API ──────────────────────────────────────────────────────────────────

export interface AuthorizeOptions {
  target: Oauth2PkceTarget
  clientId: string
  scopes: string[]
  redirectUri: string
}

export default function useOAuthPkce() {
  // ── derivation ──

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
    // Getters must not mutate - a fingerprint mismatch (e.g. the spec's client id
    // changed) just reports "no token", it never deletes the stale one here.
    if (!token || token.fingerprint !== target.fingerprint) {
      return undefined
    }
    return token
  }

  const errorFor = (target: Oauth2PkceTarget): Oauth2AuthError | undefined => errors.value[target.schemeKey]

  // ── actions ──

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
      // Best-effort warm-up only, so the click handler that calls `authorize()` can stay
      // synchronous up to `window.open` - a failure here just means `authorize()` will
      // generate its own challenge instead. Never surface this as a user-facing error.
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

    // 5. Open the pop-up SYNCHRONOUSLY, before any `await` below.
    //
    // `crypto.subtle.digest` (used just below to derive the PKCE challenge) is async.
    // `await digest(); window.open(url)` loses the user-activation flag from the click
    // that called `authorize()` by the time `window.open` actually runs - Safari blocks
    // that outright, and Firefox blocks it intermittently. This is the single most
    // commonly reintroduced bug in this feature: `openAuthorizationPopup()` must stay
    // the very first thing that can run after the synchronous validation above, with no
    // `await` inserted before it.
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

      // 9. Validate `state` before doing anything else - no token request on mismatch.
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
      // Compare by reference, not scheme key: a newer `authorize()` call for the same
      // scheme may already have installed its own `activeFlow` by the time this one's
      // `finally` runs, and that must not be clobbered.
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

    // No token now, so the combined-header assembly in TryItAuth.vue must stop seeing one.
    commitToken(target)
  }

  /**
   * Refresh the token for `target`. Single-flight per scheme key - this is correctness,
   * not an optimisation: with refresh-token rotation, two concurrent Try-It calls both
   * refreshing at once would each hand the identity provider the same (now-superseded)
   * refresh token, and the loser would be rejected, invalidating the whole session.
   *
   * Never opens a pop-up or navigates anywhere - a failed refresh just clears credentials
   * so the user has to click Authorize again.
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
