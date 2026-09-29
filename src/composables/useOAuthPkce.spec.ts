import { webcrypto } from 'node:crypto'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import useOAuthPkce from './useOAuthPkce'
import useAuth from './useAuth'
import { generateCodeChallenge } from '@/utils/oauth-pkce'
import { OAUTH_MESSAGE_TYPE } from '@/utils/oauth-popup'
import type { Oauth2AuthStatus, Oauth2PkceTarget } from '@/types'

// the token request the flow sent: its URL, fetch options and form body
const tokenRequest = () => {
  const [url, options] = vi.mocked(fetch).mock.calls[0]!
  return { url, options: options!, body: options!.body as URLSearchParams }
}

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
  useOAuthPkce().reset()

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
 * Starts a sign-in and returns ways to drive it to an end. Stays synchronous up to calling authorize(),
 * so a second authorize() call in the same tick still lands during this flow's PKCE-challenge digest.
 * authorizeUrl() waits for the popup to navigate and returns that URL.
 * answer() waits for the navigation, then posts the callback page's reply (a valid code and the real
 * state by default, override any field) and waits for the flow to end.
 */
const startSignIn = (target: Oauth2PkceTarget, popup: ReturnType<typeof createFakePopup> = fakePopup) => {
  const navCountBefore = popup.location.replace.mock.calls.length
  const done = useOAuthPkce().authorize({ target, ...AUTHORIZE_OPTS_BASE })

  const authorizeUrl = async (): Promise<URL> => {
    await waitFor(() => popup.location.replace.mock.calls.length > navCountBefore)
    return new URL(popup.location.replace.mock.calls.at(-1)![0])
  }

  const answer = async (params: { code?: string, state?: string, error?: string, errorDescription?: string } = {}): Promise<void> => {
    const url = await authorizeUrl()
    dispatchCallback(popup, { code: 'auth-code-1', state: url.searchParams.get('state')!, ...params })
    await done
  }

  return { done, authorizeUrl, answer }
}

/** Drive authorize() for target all the way to a committed token, using whatever global.fetch is mocked to at call time. */
const seedToken = async (
  target: Oauth2PkceTarget,
  overrides: { expiresIn?: number, accessToken?: string } = {},
): Promise<void> => {
  const { expiresIn = 3600, accessToken = 'tok-initial' } = overrides
  global.fetch = vi.fn().mockResolvedValue(jsonResponse({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresIn,
  }))

  await startSignIn(target).answer()
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
    const { statusFor, reset } = useOAuthPkce()
    const target = buildTarget()

    const flow = startSignIn(target)
    // `busy` is set synchronously, before `authorize()`'s first await - no need to wait.
    expect(statusFor(target)).toBe('authorizing')

    await flow.authorizeUrl()
    reset()
    await flow.done
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
  // seeds one target per status, under distinct scheme keys
  const targetsWith = async (statuses: readonly Oauth2AuthStatus[]): Promise<Oauth2PkceTarget[]> => {
    const targets: Oauth2PkceTarget[] = []
    for (const [i, status] of statuses.entries()) {
      const target = buildTarget({ schemeKey: `target-${i}` })
      if (status === 'authenticated') {
        await seedToken(target)
      } else if (status === 'expired') {
        await seedToken(target, { expiresIn: 20 })
      }
      targets.push(target)
    }
    return targets
  }

  for (const { name, statuses, expected } of [
    { name: 'returns unauthenticated for an empty array', statuses: [], expected: 'unauthenticated' },
    { name: 'worst-wins: expired beats unauthenticated and authenticated', statuses: ['expired', 'unauthenticated', 'authenticated'], expected: 'expired' },
    { name: 'worst-wins: unauthenticated beats authenticated', statuses: ['authenticated', 'unauthenticated'], expected: 'unauthenticated' },
    { name: 'returns authenticated when every target is authenticated', statuses: ['authenticated', 'authenticated'], expected: 'authenticated' },
  ] as const) {
    it(name, async () => {
      expect(useOAuthPkce().aggregateStatus(await targetsWith(statuses))).toBe(expected)
    })
  }

  it('worst-wins: authorizing beats every other status', async () => {
    const authenticatedTarget = buildTarget({ schemeKey: 'a' })
    await seedToken(authenticatedTarget)

    const { statusFor, aggregateStatus, reset } = useOAuthPkce()
    const authorizingTarget = buildTarget({ schemeKey: 'b' })
    const flow = startSignIn(authorizingTarget)
    // `busy` is set synchronously, before `authorize()`'s first await - no need to wait.
    expect(statusFor(authorizingTarget)).toBe('authorizing')

    expect(aggregateStatus([authenticatedTarget, authorizingTarget])).toBe('authorizing')

    await flow.authorizeUrl()
    reset()
    await flow.done
  })
})

describe('authorize guard rails', () => {
  it('sets an error and never opens a popup when redirectUri is missing', async () => {
    const { authorize, errorFor } = useOAuthPkce()
    const target = buildTarget()

    await authorize({ target, clientId: 'client-123', scopes: [], redirectUri: '' })

    expect(errorFor(target)).toContain('Set the oauthRedirectUri prop')
    expect(window.open).not.toHaveBeenCalled()
  })

  it('sets an unsupported-crypto message and never opens a popup when crypto.subtle is unavailable', async () => {
    vi.stubGlobal('crypto', { getRandomValues: vi.fn() })

    const { authorize, errorFor } = useOAuthPkce()
    const target = buildTarget()
    await authorize({ target, ...AUTHORIZE_OPTS_BASE })

    expect(errorFor(target)).toContain('secure context')
    expect(window.open).not.toHaveBeenCalled()
  })

  it('sets a popup-blocked message and clears busy when window.open returns null', async () => {
    openSpy.mockReturnValue(null)

    const { authorize, errorFor, statusFor } = useOAuthPkce()
    const target = buildTarget()
    await authorize({ target, ...AUTHORIZE_OPTS_BASE })

    expect(errorFor(target)).toContain('blocked the sign-in window')
    expect(statusFor(target)).toBe('unauthenticated')
  })

  it('opens the popup synchronously, before any await', async () => {
    const { reset } = useOAuthPkce()
    const target = buildTarget()

    const flow = startSignIn(target)
    // Same tick, before any await here, proves window.open ran synchronously, not after the PKCE-challenge digest.
    expect(window.open).toHaveBeenCalledTimes(1)

    // Let the flow finish installing timers/listeners, then tear it down so nothing leaks into the next test.
    await flow.authorizeUrl()
    reset()
    await flow.done
  })

  for (const { name, redirectUri, expected } of [
    { name: 'not a valid URL', redirectUri: 'http://[', expected: 'not a valid URL' },
    { name: 'not http or https', redirectUri: 'ftp://app.example.com/callback', expected: 'must use http or https' },
  ]) {
    it(`rejects a redirect URI that is ${name}`, async () => {
      const target = buildTarget()
      const { authorize, errorFor, statusFor } = useOAuthPkce()

      await authorize({ target, clientId: 'client-123', scopes: [], redirectUri })

      expect(errorFor(target)).toContain(expected)
      expect(window.open).not.toHaveBeenCalled()
      expect(statusFor(target)).not.toBe('authorizing')
    })
  }
})

describe('authorize endpoint validation', () => {
  for (const { name, override } of [
    { name: 'authorizationUrl', override: { authorizationUrl: 'javascript:evil();//' } },
    { name: 'tokenUrl', override: { tokenUrl: 'javascript:evil()' } },
  ]) {
    it(`rejects a javascript: ${name} before any popup opens`, async () => {
      const target = buildTarget(override)
      const { authorize, errorFor, statusFor } = useOAuthPkce()

      await authorize({ target, ...AUTHORIZE_OPTS_BASE })

      expect(errorFor(target)).toContain('URL')
      expect(window.open).not.toHaveBeenCalled()
      expect(statusFor(target)).not.toBe('authorizing')
      expect(useAuth().authInputs.value[`${target.schemeKey}-token`]).toBeFalsy()
    })
  }
})

describe('authorize URL correctness', () => {
  it('builds an authorize URL with exactly the required PKCE params, and the challenge matches the verifier later sent to the token endpoint', async () => {
    const target = buildTarget()
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok-abc', token_type: 'Bearer', expires_in: 3600 }))

    const flow = startSignIn(target)
    const authorizeUrl = await flow.authorizeUrl()

    expect(fakePopup.location.replace).toHaveBeenCalledTimes(1)
    expect(authorizeUrl.searchParams.get('response_type')).toBe('code')
    expect(authorizeUrl.searchParams.get('client_id')).toBe('client-123')
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe('https://app.example.com/callback')
    expect(authorizeUrl.searchParams.get('scope')).toBe('read write')
    expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256')
    expect(authorizeUrl.searchParams.get('state')).toBeTruthy()
    expect(authorizeUrl.searchParams.get('code_challenge')).toBeTruthy()

    const codeChallenge = authorizeUrl.searchParams.get('code_challenge')!
    await flow.answer()

    const verifierUsed = tokenRequest().body.get('code_verifier')!
    expect(await generateCodeChallenge(verifierUsed)).toBe(codeChallenge)
  })

  it('the token request body has no client_secret and no Authorization header, and uses credentials: omit', async () => {
    const target = buildTarget()
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok-abc', token_type: 'Bearer', expires_in: 3600 }))

    await startSignIn(target).answer()

    const { options, body } = tokenRequest()
    expect(options.credentials).toBe('omit')
    expect(body.has('client_secret')).toBe(false)
    expect(new Headers(options.headers).has('Authorization')).toBe(false)
  })
})

describe('authorize happy path', () => {
  it('exchanges the code for a token and commits it via authInputs (not authHeadersMap)', async () => {
    const target = buildTarget()
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok-abc', token_type: 'Bearer', expires_in: 3600 }))

    const { statusFor } = useOAuthPkce()
    const flow = startSignIn(target)
    const authorizeUrl = await flow.authorizeUrl()
    await flow.answer()

    expect(fetch).toHaveBeenCalledTimes(1)
    const { url, options, body } = tokenRequest()

    expect(url).toBe(target.tokenUrl)
    expect(options.method).toBe('POST')
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('code')).toBe('auth-code-1')
    expect(body.get('redirect_uri')).toBe(authorizeUrl.searchParams.get('redirect_uri'))
    expect(body.get('code_verifier')).toBeTruthy()

    expect(statusFor(target)).toBe('authenticated')

    const { authInputs, authHeadersMap } = useAuth()
    expect(authInputs.value[`${target.schemeKey}-token`]).toBe('Bearer tok-abc')
    expect(authHeadersMap.value).toEqual({})
  })

  it('does not exchange the code twice when the same valid message is replayed after success', async () => {
    const target = buildTarget()
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok-abc', expires_in: 3600 }))

    const flow = startSignIn(target)
    await flow.answer()
    expect(fetch).toHaveBeenCalledTimes(1)

    const state = (await flow.authorizeUrl()).searchParams.get('state')!
    // The message listener was torn down on success - replaying it is a no-op.
    dispatchCallback(fakePopup, { code: 'auth-code-1', state })
    await tick()

    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('authorize callback error taxonomy', () => {
  it('rejects a state mismatch without ever calling the token endpoint', async () => {
    const target = buildTarget()
    const { errorFor } = useOAuthPkce()

    await startSignIn(target).answer({ state: 'not-the-real-state' })

    expect(errorFor(target)).toContain('state mismatch')
    expect(fetch).not.toHaveBeenCalled()
  })

  for (const { name, params, expected } of [
    { name: 'maps error=access_denied to a user-facing denial message', params: { error: 'access_denied' }, expected: 'Access was denied at the identity provider.' },
    { name: 'uses error_description for another error', params: { error: 'server_error', errorDescription: 'Something broke upstream' }, expected: 'Something broke upstream' },
    { name: 'reports a missing code', params: { code: undefined }, expected: 'did not return an authorization code' },
  ]) {
    it(`${name}, without calling the token endpoint`, async () => {
      const target = buildTarget()
      const { errorFor } = useOAuthPkce()

      await startSignIn(target).answer(params)

      expect(errorFor(target)).toContain(expected)
      expect(fetch).not.toHaveBeenCalled()
    })
  }
})

describe('token endpoint response handling', () => {
  it('reports a missing access_token when the token endpoint returns 2xx without one', async () => {
    const target = buildTarget()
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ token_type: 'Bearer' }))

    await startSignIn(target).answer()

    expect(useOAuthPkce().errorFor(target)).toContain('did not include an access_token')
    const { authInputs } = useAuth()
    expect(authInputs.value[`${target.schemeKey}-token`]).toBeFalsy()
  })

  it('surfaces RFC 6749 error/error_description on a non-ok token response', async () => {
    const target = buildTarget()
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(
      { error: 'invalid_grant', error_description: 'PKCE verification failed' },
      { ok: false, status: 400 },
    ))

    await startSignIn(target).answer()

    expect(useOAuthPkce().errorFor(target)).toBe('PKCE verification failed')
  })

  for (const { name, rejection } of [
    { name: 'Chrome', rejection: new TypeError('Failed to fetch') },
    { name: 'Safari', rejection: new TypeError('Load failed') },
    { name: 'Firefox', rejection: new TypeError('NetworkError when attempting to fetch resource.') },
  ]) {
    it(`reports a reachability error for a ${name}-style fetch rejection, regardless of its own message text`, async () => {
      const target = buildTarget()
      global.fetch = vi.fn().mockRejectedValue(rejection)

      await startSignIn(target).answer()

      expect(useOAuthPkce().errorFor(target)).toContain('Unable to reach the token endpoint')
    })
  }

  it('classifies an AbortError as a timeout', async () => {
    const target = buildTarget()
    const abortError = new Error('The operation was aborted.')
    abortError.name = 'AbortError'
    global.fetch = vi.fn().mockRejectedValue(abortError)

    await startSignIn(target).answer()

    expect(useOAuthPkce().errorFor(target)).toContain('timed out')
  })
})

// Real SHA-256 never finishes while timers are faked, so the fake-timer tests below make it instant.
describe('popup lifecycle', () => {
  it('reports a closed-popup message when the user closes the sign-in window', async () => {
    const target = buildTarget()
    const { authorize, errorFor } = useOAuthPkce()
    vi.spyOn(webcrypto.subtle, 'digest').mockResolvedValue(new ArrayBuffer(32))
    vi.useFakeTimers()

    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })

    fakePopup.closed = true
    await vi.advanceTimersByTimeAsync(600)

    await promise

    expect(errorFor(target)).toContain('closed before returning')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('reports a timeout message when the flow exceeds the 5-minute window', async () => {
    const target = buildTarget()
    const { authorize, errorFor } = useOAuthPkce()
    vi.spyOn(webcrypto.subtle, 'digest').mockResolvedValue(new ArrayBuffer(32))
    vi.useFakeTimers()

    const promise = authorize({ target, ...AUTHORIZE_OPTS_BASE })

    await vi.advanceTimersByTimeAsync(5 * 60_000 + 1_000)

    await promise

    expect(errorFor(target)).toContain('Sign-in timed out')
  })
})

describe('authorize unexpected failures', () => {
  // Regression: the popup wait starts before the first await, so an early throw left its listener and
  // timers running, and the popup poll later rejected with nobody handling it.
  it('surfaces the thrown message and tears the popup wait down when popup.location.replace throws', async () => {
    const target = buildTarget()
    const { authorize, errorFor, statusFor } = useOAuthPkce()
    // real SHA-256 never finishes while timers are faked, so make it instant
    vi.spyOn(webcrypto.subtle, 'digest').mockResolvedValue(new ArrayBuffer(32))
    vi.useFakeTimers()
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    fakePopup.location.replace.mockImplementation(() => {
      throw new Error('blocked')
    })

    await authorize({ target, ...AUTHORIZE_OPTS_BASE })

    expect(errorFor(target)).toBe('blocked')
    expect(statusFor(target)).not.toBe('authorizing')
    expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function))
    expect(fakePopup.close).toHaveBeenCalled()

    // run past the popup poll: nothing may be left running to reject
    await vi.advanceTimersByTimeAsync(1_000)
    expect(fetch).not.toHaveBeenCalled()
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

describe('authorize single-flow exclusivity', () => {
  // starts a sign-in on its own popup, with the token endpoint mocked to answer tok-A
  const startFlow = (target: Oauth2PkceTarget) => {
    const popup = createFakePopup()
    openSpy.mockReturnValueOnce(popup as unknown as Window)
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok-A', token_type: 'Bearer', expires_in: 3600 }))
    return { popup, ...startSignIn(target, popup) }
  }

  it('double-click: the second call is rejected during the PKCE digest window, the first proceeds', async () => {
    const target = buildTarget()
    const { authorize, statusFor, tokenFor, errorFor } = useOAuthPkce()

    // Same synchronous block with an empty challenge cache, like a double-click. The second call must
    // already see the first flow even though it hasn't navigated yet, thanks to registering before the digest.
    const flowA = startFlow(target)
    await authorize({ target, ...AUTHORIZE_OPTS_BASE })

    expect(errorFor(target)).toContain('already in progress')
    expect(statusFor(target)).toBe('authorizing')
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(flowA.popup.close).not.toHaveBeenCalled()

    await flowA.answer({ code: 'auth-code-A' })

    expect(flowA.popup.location.replace).toHaveBeenCalledTimes(1)
    expect(statusFor(target)).toBe('authenticated')
    expect(tokenFor(target)?.accessToken).toBe('tok-A')
    // the success clears the rejected second click's error
    expect(errorFor(target)).toBeUndefined()
  })

  it('rejects a second authorize() for a different scheme too, leaving the active flow untouched', async () => {
    const targetA = buildTarget({ schemeKey: 'kA' })
    const targetB = buildTarget({ schemeKey: 'kB' })
    const { authorize, statusFor, tokenFor, errorFor } = useOAuthPkce()

    const flowA = startFlow(targetA)
    await authorize({ target: targetB, ...AUTHORIZE_OPTS_BASE })

    expect(errorFor(targetB)).toContain('already in progress')
    expect(errorFor(targetA)).toBeUndefined()
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(flowA.popup.close).not.toHaveBeenCalled()

    await flowA.answer({ code: 'auth-code-A' })

    expect(statusFor(targetA)).toBe('authenticated')
    expect(tokenFor(targetA)?.accessToken).toBe('tok-A')
    // nothing in A's success path touches the rejected scheme's error slot
    expect(errorFor(targetB)).toContain('already in progress')
  })
})

describe('storage NFR guard', () => {
  it('leaves both localStorage and sessionStorage empty after a full authorize cycle', async () => {
    const target = buildTarget()
    await seedToken(target)

    expect(window.sessionStorage.length).toBe(0)
    expect(window.localStorage.length).toBe(0)
  })
})
