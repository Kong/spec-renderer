import { webcrypto } from 'node:crypto'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import useOAuthPkce from './useOAuthPkce'
import useAuth from './useAuth'
import { generateCodeChallenge } from '@/utils/oauth-pkce'
import { OAUTH_MESSAGE_TYPE } from '@/utils/oauth-popup'
import type { Oauth2PkceTarget } from '@/types'

// jsdom provides crypto.getRandomValues but not crypto.subtle, stub real WebCrypto for the whole file, matching oauth-pkce.spec.ts.
beforeAll(() => {
  vi.stubGlobal('crypto', webcrypto)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const AUTHORIZE_OPTS_BASE = {
  clientId: 'client-123',
  scopes: ['read', 'write'],
  redirectUri: 'https://app.example.com/callback',
}

const buildTarget = (overrides: Partial<Oauth2PkceTarget> = {}): Oauth2PkceTarget => ({
  schemeKey: 'oauth2Auth',
  authorizationUrl: 'https://auth.example.com/authorize',
  tokenUrl: 'https://auth.example.com/token',
  scopes: {},
  fingerprint: 'fp-1',
  ...overrides,
})

// jsdom's window.open returns undefined, stand in a fake popup for the flow to navigate/poll/close.
const createFakePopup = () => ({
  closed: false,
  focus: vi.fn(),
  close: vi.fn(),
  location: { replace: vi.fn() },
})

// Plain object satisfying the bits of Response this module reads, fetch is fully mocked so no need for a real Response.
const jsonResponse = (body: unknown, init: { ok?: boolean, status?: number } = {}) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: async () => body,
})

// jsdom's window.postMessage delivers origin: '' and source: null, which correct validation rejects; hand-build the event the callback page would send instead.
const dispatchCallback = (
  popup: unknown,
  params: { code?: string, state?: string, error?: string, errorDescription?: string },
  origin = 'https://app.example.com',
): void => {
  const data: Record<string, unknown> = { type: OAUTH_MESSAGE_TYPE }
  if (params.code !== undefined) data.code = params.code
  if (params.state !== undefined) data.state = params.state
  if (params.error !== undefined) data.error = params.error
  if (params.errorDescription !== undefined) data.error_description = params.errorDescription

  window.dispatchEvent(new MessageEvent('message', { data, origin, source: popup as Window }))
}

let openSpy: ReturnType<typeof vi.spyOn>
let fakePopup: ReturnType<typeof createFakePopup>
let originalFetch: typeof fetch

beforeAll(() => {
  originalFetch = global.fetch
})

afterAll(() => {
  global.fetch = originalFetch
})

beforeEach(() => {
  useOAuthPkce().__resetForTests()

  const { authInputs, authHeadersMap, authQueryMap, activeSecurityScheme } = useAuth()
  authInputs.value = {}
  authHeadersMap.value = {}
  authQueryMap.value = {}
  activeSecurityScheme.value = ''

  fakePopup = createFakePopup()
  openSpy = vi.spyOn(window, 'open').mockReturnValue(fakePopup as unknown as Window)

  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  // Restore real WebCrypto in case a test stubbed it away for the unsupported-crypto path.
  vi.stubGlobal('crypto', webcrypto)
})

/** Yield one real macrotask, only for cases with no pending crypto-digest await left to wait out. */
const tick = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))

/** Poll until predicate() is true, or throw after timeoutMs. Used instead of a fixed tick since the real WebCrypto digest can take longer than one macrotask under load. */
const waitFor = async (predicate: () => boolean, timeoutMs = 2000): Promise<void> => {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('waitFor: condition was not met within the timeout')
    }
    await new Promise(resolve => setTimeout(resolve, 5))
  }
}

/**
 * Wait until authorize() has navigated the popup past baselineCount, i.e. past the PKCE-challenge digest for the flow just started.
 * Uses a baseline rather than "any calls exist" since window.open returns the same fake popup across calls in one test; a bare check could read a stale prior flow's navigation or race a new listener.
 */
const waitForPopupNavigation = (baselineCount: number): Promise<void> =>
  waitFor(() => fakePopup.location.replace.mock.calls.length > baselineCount)

/** Drive authorize() for target all the way to a committed token, using whatever global.fetch is mocked to at call time. */
const seedToken = async (
  target: Oauth2PkceTarget,
  overrides: { expiresIn?: number, refreshToken?: string, accessToken?: string } = {},
): Promise<void> => {
  const { expiresIn = 3600, refreshToken, accessToken = 'tok-initial' } = overrides
  global.fetch = vi.fn().mockResolvedValue(jsonResponse({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresIn,
    ...(refreshToken ? { refresh_token: refreshToken } : {}),
  }))

  const { authorize } = useOAuthPkce()
  const navCountBefore = fakePopup.location.replace.mock.calls.length
  const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })
  await waitForPopupNavigation(navCountBefore)
  const authorizeUrl = new URL(fakePopup.location.replace.mock.calls.at(-1)![0])
  dispatchCallback(fakePopup, { code: 'auth-code-1', state: authorizeUrl.searchParams.get('state')! })
  await promise
}

describe('statusFor', () => {
  it('is unauthenticated with no token', () => {
    const { statusFor } = useOAuthPkce()
    expect(statusFor(buildTarget())).toBe('unauthenticated')
  })

  it('is authenticated after a successful authorize', async () => {
    const target = buildTarget()
    await seedToken(target)

    expect(useOAuthPkce().statusFor(target)).toBe('authenticated')
  })

  it('is expired when expiresAt falls within the expiry skew', async () => {
    const target = buildTarget()
    // 20s < the 30s EXPIRY_SKEW_MS, so the token is "expired" the instant it's minted.
    await seedToken(target, { expiresIn: 20 })

    expect(useOAuthPkce().statusFor(target)).toBe('expired')
  })

  it('is unauthenticated when the fingerprint does not match', async () => {
    const target = buildTarget({ fingerprint: 'fp-1' })
    await seedToken(target)

    expect(useOAuthPkce().statusFor(buildTarget({ fingerprint: 'fp-2' }))).toBe('unauthenticated')
  })

  it('is authorizing while a flow is in progress', async () => {
    const { authorize, statusFor, __resetForTests } = useOAuthPkce()
    const target = buildTarget()

    const navCountBefore = fakePopup.location.replace.mock.calls.length
    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })
    // `busy` is set synchronously, before `authorize()`'s first await - no need to wait.
    expect(statusFor(target)).toBe('authorizing')

    await waitForPopupNavigation(navCountBefore)
    __resetForTests()
    await promise
  })
})

describe('tokenFor', () => {
  it('returns undefined on a fingerprint mismatch without deleting the real token', async () => {
    const target = buildTarget({ fingerprint: 'fp-1' })
    await seedToken(target, { accessToken: 'tok-real' })

    const { tokenFor, statusFor } = useOAuthPkce()
    expect(tokenFor(buildTarget({ fingerprint: 'fp-2' }))).toBeUndefined()
    expect(tokenFor(target)?.accessToken).toBe('tok-real')
    expect(statusFor(target)).toBe('authenticated')
  })
})

describe('aggregateStatus', () => {
  it('returns unauthenticated for an empty array', () => {
    expect(useOAuthPkce().aggregateStatus([])).toBe('unauthenticated')
  })

  it('worst-wins: authorizing beats every other status', async () => {
    const authenticatedTarget = buildTarget({ schemeKey: 'a' })
    await seedToken(authenticatedTarget)

    const { authorize, statusFor, aggregateStatus, __resetForTests } = useOAuthPkce()
    const authorizingTarget = buildTarget({ schemeKey: 'b' })
    const navCountBefore = fakePopup.location.replace.mock.calls.length
    const promise = authorize({ target: authorizingTarget, ...AUTHORIZE_OPTS_BASE })
    // `busy` is set synchronously, before `authorize()`'s first await - no need to wait.
    expect(statusFor(authorizingTarget)).toBe('authorizing')

    expect(aggregateStatus([authenticatedTarget, authorizingTarget])).toBe('authorizing')

    await waitForPopupNavigation(navCountBefore)
    __resetForTests()
    await promise
  })

  it('worst-wins: expired beats unauthenticated and authenticated', async () => {
    const expiredTarget = buildTarget({ schemeKey: 'a' })
    await seedToken(expiredTarget, { expiresIn: 20 })
    const unauthTarget = buildTarget({ schemeKey: 'b' })

    expect(useOAuthPkce().aggregateStatus([expiredTarget, unauthTarget])).toBe('expired')
  })

  it('worst-wins: unauthenticated beats authenticated', async () => {
    const authenticatedTarget = buildTarget({ schemeKey: 'a' })
    await seedToken(authenticatedTarget)
    const unauthTarget = buildTarget({ schemeKey: 'b' })

    expect(useOAuthPkce().aggregateStatus([authenticatedTarget, unauthTarget])).toBe('unauthenticated')
  })

  it('returns authenticated when every target is authenticated', async () => {
    const targetA = buildTarget({ schemeKey: 'a' })
    const targetB = buildTarget({ schemeKey: 'b' })
    await seedToken(targetA)
    await seedToken(targetB)

    expect(useOAuthPkce().aggregateStatus([targetA, targetB])).toBe('authenticated')
  })
})

describe('authorize guard rails', () => {
  it('sets an error and never opens a popup when redirectUri is missing', async () => {
    const { authorize, errorFor } = useOAuthPkce()
    const target = buildTarget()

    await authorize({ target, clientId: 'client-123', scopes: [], redirectUri: '' })

    expect(errorFor(target)?.kind).toBe('oauth')
    expect(window.open).not.toHaveBeenCalled()
  })

  it('sets unsupported-crypto and never opens a popup when crypto.subtle is unavailable', async () => {
    vi.stubGlobal('crypto', { getRandomValues: vi.fn() })

    const { authorize, errorFor } = useOAuthPkce()
    const target = buildTarget()
    await authorize({ target, ...AUTHORIZE_OPTS_BASE })

    expect(errorFor(target)?.kind).toBe('unsupported-crypto')
    expect(window.open).not.toHaveBeenCalled()
  })

  it('sets popup-blocked and clears busy when window.open returns null', async () => {
    openSpy.mockReturnValue(null)

    const { authorize, errorFor, statusFor } = useOAuthPkce()
    const target = buildTarget()
    await authorize({ target, ...AUTHORIZE_OPTS_BASE })

    expect(errorFor(target)?.kind).toBe('popup-blocked')
    expect(statusFor(target)).toBe('unauthenticated')
  })

  it('opens the popup synchronously, before any await', async () => {
    const { authorize, __resetForTests } = useOAuthPkce()
    const target = buildTarget()

    const navCountBefore = fakePopup.location.replace.mock.calls.length
    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })
    // Same tick, before any await here, proves window.open ran synchronously, not after the PKCE-challenge digest.
    expect(window.open).toHaveBeenCalledTimes(1)

    // Let the flow finish installing timers/listeners, then tear it down so nothing leaks into the next test.
    await waitForPopupNavigation(navCountBefore)
    __resetForTests()
    await promise
  })
})

describe('authorize URL correctness', () => {
  it('builds an authorize URL with exactly the required PKCE params, and the challenge matches the verifier later sent to the token endpoint', async () => {
    const target = buildTarget()
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok-abc', token_type: 'Bearer', expires_in: 3600 }))

    const { authorize } = useOAuthPkce()
    const navCountBefore = fakePopup.location.replace.mock.calls.length
    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })
    await waitForPopupNavigation(navCountBefore)

    expect(fakePopup.location.replace).toHaveBeenCalledTimes(1)
    const authorizeUrl = new URL(fakePopup.location.replace.mock.calls[0][0])

    expect(authorizeUrl.searchParams.get('response_type')).toBe('code')
    expect(authorizeUrl.searchParams.get('client_id')).toBe('client-123')
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe('https://app.example.com/callback')
    expect(authorizeUrl.searchParams.get('scope')).toBe('read write')
    expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256')
    expect(authorizeUrl.searchParams.get('state')).toBeTruthy()
    expect(authorizeUrl.searchParams.get('code_challenge')).toBeTruthy()

    const state = authorizeUrl.searchParams.get('state')!
    const codeChallenge = authorizeUrl.searchParams.get('code_challenge')!

    dispatchCallback(fakePopup, { code: 'auth-code-1', state })
    await promise

    const [, options] = (fetch as unknown as { mock: { calls: Array<[string, RequestInit & { body: URLSearchParams }]> } }).mock.calls[0]
    const verifierUsed = options.body.get('code_verifier')!
    expect(await generateCodeChallenge(verifierUsed)).toBe(codeChallenge)
  })
})

describe('authorize happy path', () => {
  it('exchanges the code for a token and commits it via authInputs (not authHeadersMap directly)', async () => {
    const target = buildTarget()
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok-abc', token_type: 'Bearer', expires_in: 3600 }))

    const { authorize, statusFor } = useOAuthPkce()
    const navCountBefore = fakePopup.location.replace.mock.calls.length
    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })
    await waitForPopupNavigation(navCountBefore)

    const authorizeUrl = new URL(fakePopup.location.replace.mock.calls[0][0])
    const state = authorizeUrl.searchParams.get('state')!

    dispatchCallback(fakePopup, { code: 'auth-code-1', state })
    await promise

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, options] = (fetch as unknown as { mock: { calls: Array<[string, RequestInit & { body: URLSearchParams, headers: Record<string, string> }]> } }).mock.calls[0]

    expect(url).toBe(target.tokenUrl)
    expect(options.method).toBe('POST')
    expect(options.credentials).toBe('omit')
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(options.body.get('grant_type')).toBe('authorization_code')
    expect(options.body.get('code')).toBe('auth-code-1')
    expect(options.body.get('redirect_uri')).toBe(authorizeUrl.searchParams.get('redirect_uri'))
    expect(options.body.get('code_verifier')).toBeTruthy()
    expect(options.body.has('client_secret')).toBe(false)
    expect(options.headers.Authorization).toBeUndefined()

    expect(statusFor(target)).toBe('authenticated')

    const { authInputs } = useAuth()
    expect(authInputs.value[`${target.schemeKey}-token`]).toBe('Bearer tok-abc')
  })

  it('does not exchange the code twice when the same valid message is replayed after success', async () => {
    const target = buildTarget()
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok-abc', expires_in: 3600 }))

    const { authorize } = useOAuthPkce()
    const navCountBefore = fakePopup.location.replace.mock.calls.length
    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })
    await waitForPopupNavigation(navCountBefore)
    const authorizeUrl = new URL(fakePopup.location.replace.mock.calls[0][0])
    const state = authorizeUrl.searchParams.get('state')!

    dispatchCallback(fakePopup, { code: 'auth-code-1', state })
    await promise

    expect(fetch).toHaveBeenCalledTimes(1)

    // The message listener was torn down on success - replaying it is a no-op.
    dispatchCallback(fakePopup, { code: 'auth-code-1', state })
    await tick()

    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('authorize callback error taxonomy', () => {
  const startAndCallback = async (
    target: Oauth2PkceTarget,
    params: { code?: string, state?: string, error?: string, errorDescription?: string },
  ): Promise<void> => {
    const { authorize } = useOAuthPkce()
    const navCountBefore = fakePopup.location.replace.mock.calls.length
    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })
    await waitForPopupNavigation(navCountBefore)
    dispatchCallback(fakePopup, params)
    await promise
  }

  it('rejects a state mismatch without ever calling the token endpoint', async () => {
    const target = buildTarget()
    const { errorFor } = useOAuthPkce()

    await startAndCallback(target, { code: 'auth-code-1', state: 'not-the-real-state' })

    expect(errorFor(target)?.kind).toBe('state-mismatch')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('maps error=access_denied to user-denied without calling the token endpoint', async () => {
    const target = buildTarget()
    const { authorize, errorFor } = useOAuthPkce()
    const navCountBefore = fakePopup.location.replace.mock.calls.length
    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })
    await waitForPopupNavigation(navCountBefore)
    const authorizeUrl = new URL(fakePopup.location.replace.mock.calls[0][0])
    dispatchCallback(fakePopup, { error: 'access_denied', state: authorizeUrl.searchParams.get('state')! })
    await promise

    expect(errorFor(target)?.kind).toBe('user-denied')
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('token endpoint response handling', () => {
  const startAndExchange = async (target: Oauth2PkceTarget): Promise<void> => {
    const { authorize } = useOAuthPkce()
    const navCountBefore = fakePopup.location.replace.mock.calls.length
    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })
    await waitForPopupNavigation(navCountBefore)
    const authorizeUrl = new URL(fakePopup.location.replace.mock.calls[0][0])
    dispatchCallback(fakePopup, { code: 'auth-code-1', state: authorizeUrl.searchParams.get('state')! })
    await promise
  }

  it('sets invalid-response when the token endpoint returns 2xx without an access_token', async () => {
    const target = buildTarget()
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ token_type: 'Bearer' }))

    await startAndExchange(target)

    expect(useOAuthPkce().errorFor(target)?.kind).toBe('invalid-response')
    const { authInputs } = useAuth()
    expect(authInputs.value[`${target.schemeKey}-token`]).toBeFalsy()
  })

  it('surfaces RFC 6749 error/error_description on a non-ok token response', async () => {
    const target = buildTarget()
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(
      { error: 'invalid_grant', error_description: 'PKCE verification failed' },
      { ok: false, status: 400 },
    ))

    await startAndExchange(target)

    const error = useOAuthPkce().errorFor(target)
    expect(error?.kind).toBe('oauth')
    expect(error?.error).toBe('invalid_grant')
    expect(error?.errorDescription).toBe('PKCE verification failed')
    expect(error?.message).toBe('PKCE verification failed')
  })

  it.each([
    ['Chrome', new TypeError('Failed to fetch')],
    ['Safari', new TypeError('Load failed')],
    ['Firefox', new TypeError('NetworkError when attempting to fetch resource.')],
  ])('classifies a %s-style fetch rejection as a network error (no string matching), carrying tokenUrl', async (_browser, rejection) => {
    const target = buildTarget()
    global.fetch = vi.fn().mockRejectedValue(rejection)

    await startAndExchange(target)

    const error = useOAuthPkce().errorFor(target)
    expect(error?.kind).toBe('network')
    expect(error?.tokenUrl).toBe(target.tokenUrl)
  })

  it('classifies an AbortError as a timeout, distinct from a network error', async () => {
    const target = buildTarget()
    const abortError = new Error('The operation was aborted.')
    abortError.name = 'AbortError'
    global.fetch = vi.fn().mockRejectedValue(abortError)

    await startAndExchange(target)

    expect(useOAuthPkce().errorFor(target)?.kind).toBe('timeout')
  })
})

/** Flush pending microtasks/macrotasks repeatedly, the real WebCrypto digest resolves independently of fake timers and one advance isn't always enough under load. */
describe('popup lifecycle', () => {
  it('reports popup-closed when the user closes the sign-in window', async () => {
    const target = buildTarget()
    const { authorize, errorFor, precomputeChallenge } = useOAuthPkce()
    // hash with real timers first: real crypto never finishes while timers are faked, so authorize() would hang on a slow machine
    await precomputeChallenge(target)
    vi.useFakeTimers()

    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })

    fakePopup.closed = true
    await vi.advanceTimersByTimeAsync(600)

    await promise

    expect(errorFor(target)?.kind).toBe('popup-closed')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('reports timeout when the flow exceeds the 5-minute window', async () => {
    const target = buildTarget()
    const { authorize, errorFor, precomputeChallenge } = useOAuthPkce()
    // hash with real timers first, see the test above
    await precomputeChallenge(target)
    vi.useFakeTimers()

    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })

    await vi.advanceTimersByTimeAsync(5 * 60_000 + 1_000)

    await promise

    expect(errorFor(target)?.kind).toBe('timeout')
  })
})

describe('refresh', () => {
  it('re-writes authInputs and keeps the old refreshToken when the response omits one', async () => {
    const target = buildTarget()
    await seedToken(target, { refreshToken: 'refresh-1' })

    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok-refreshed', token_type: 'Bearer', expires_in: 3600 }))

    const { refresh, tokenFor } = useOAuthPkce()
    const ok = await refresh(target)

    expect(ok).toBe(true)
    expect(tokenFor(target)?.accessToken).toBe('tok-refreshed')
    expect(tokenFor(target)?.refreshToken).toBe('refresh-1')

    const { authInputs } = useAuth()
    expect(authInputs.value[`${target.schemeKey}-token`]).toBe('Bearer tok-refreshed')
  })

  it('on invalid_grant: clears credentials, sets a session-expired error, returns false, and never opens a popup', async () => {
    const target = buildTarget()
    await seedToken(target, { refreshToken: 'refresh-1' })
    openSpy.mockClear()

    global.fetch = vi.fn().mockResolvedValue(jsonResponse(
      { error: 'invalid_grant', error_description: 'Refresh token expired' },
      { ok: false, status: 400 },
    ))

    const { refresh, tokenFor, errorFor } = useOAuthPkce()
    const ok = await refresh(target)

    expect(ok).toBe(false)
    expect(tokenFor(target)).toBeUndefined()
    expect(errorFor(target)).toEqual({ kind: 'oauth', message: 'Your session expired. Click Authorize to sign in again.' })
    expect(window.open).not.toHaveBeenCalled()

    const { authInputs } = useAuth()
    expect(authInputs.value[`${target.schemeKey}-token`]).toBe('')
  })

  it('dedupes two concurrent refresh calls into a single fetch (single-flight)', async () => {
    const target = buildTarget()
    await seedToken(target, { refreshToken: 'refresh-1' })

    let resolveFetch!: (value: unknown) => void
    global.fetch = vi.fn().mockReturnValue(new Promise((resolve) => {
      resolveFetch = resolve
    }))

    const { refresh } = useOAuthPkce()
    const first = refresh(target)
    const second = refresh(target)

    expect(fetch).toHaveBeenCalledTimes(1)

    resolveFetch(jsonResponse({ access_token: 'tok-refreshed-2', expires_in: 3600 }))

    const [okA, okB] = await Promise.all([first, second])

    expect(okA).toBe(true)
    expect(okB).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('clearCredentials', () => {
  it('empties the token, the error, and authInputs for the scheme', async () => {
    const target = buildTarget()
    await seedToken(target)

    const { clearCredentials, tokenFor, errorFor } = useOAuthPkce()
    clearCredentials(target)

    expect(tokenFor(target)).toBeUndefined()
    expect(errorFor(target)).toBeUndefined()
    const { authInputs } = useAuth()
    expect(authInputs.value[`${target.schemeKey}-token`]).toBe('')
  })
})

describe('storage NFR guard', () => {
  it('never touches localStorage or sessionStorage across a full authorize + refresh cycle', async () => {
    const target = buildTarget()
    await seedToken(target, { refreshToken: 'refresh-1' })

    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok-2', expires_in: 3600 }))
    await useOAuthPkce().refresh(target)

    expect(window.sessionStorage.length).toBe(0)
    expect(window.localStorage.length).toBe(0)
  })
})
