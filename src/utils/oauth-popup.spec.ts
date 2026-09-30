import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  awaitAuthorizationResponse,
  FLOW_CANCELLED,
  FLOW_TIMEOUT_MS,
  OAUTH_MESSAGE_TYPE,
  openAuthorizationPopup,
  POPUP_HEIGHT,
  POPUP_NAME,
  POPUP_POLL_MS,
  POPUP_WIDTH,
} from './oauth-popup'

// Fake pop-up: mirrors the subset of `Window` this module touches.
const makePopup = () => ({ closed: false, focus: vi.fn(), close: vi.fn(), location: { replace: vi.fn(), href: '' } })

const EXPECTED_ORIGIN = 'https://host.example.com'

// Checks a promise is still unsettled, without hanging the test - used for every "ignored" message case below.
// Marks settlement via a plain flag rather than racing against a resolved sentinel: a raced `.catch()` adds
// its own microtask hop, so an already-settled promise can still lose the race and look pending.
const isStillPending = async (promise: Promise<unknown>): Promise<boolean> => {
  let settled = false
  const markSettled = (): void => {
    settled = true
  }
  promise.then(markSettled, markSettled).catch(() => {})
  // yield a macrotask, giving any microtask-queued settlement a chance to run first
  await new Promise(resolve => setTimeout(resolve, 0))
  return !settled
}

describe('oauth-popup', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  describe('openAuthorizationPopup', () => {
    it('calls window.open with an empty url, the popup name, and centred/sized features', () => {
      const openSpy = vi.fn<typeof window.open>(() => makePopup() as unknown as Window)
      vi.stubGlobal('open', openSpy)

      openAuthorizationPopup()

      expect(openSpy).toHaveBeenCalledTimes(1)
      const [url, name, features] = openSpy.mock.calls[0]!
      expect(url).toBe('')
      expect(name).toBe(POPUP_NAME)
      expect(name).toBe('kong-spec-renderer-oauth')
      expect(features).toContain(`width=${POPUP_WIDTH}`)
      expect(features).toContain(`height=${POPUP_HEIGHT}`)
    })

    it('never includes noopener or noreferrer in the features string', () => {
      const openSpy = vi.fn<typeof window.open>(() => makePopup() as unknown as Window)
      vi.stubGlobal('open', openSpy)

      openAuthorizationPopup()

      const features = openSpy.mock.calls[0]![2]!
      expect(features).not.toContain('noopener')
      expect(features).not.toContain('noreferrer')
    })

    for (const { name, opened } of [
      // also what a real browser returns when it blocks the popup
      { name: 'window.open returns undefined (jsdom default, and real blocking)', opened: undefined },
      { name: 'window.open returns null', opened: null },
      { name: 'the returned window is already closed', opened: { ...makePopup(), closed: true } },
    ]) {
      it(`returns null when ${name}`, () => {
        vi.stubGlobal('open', vi.fn(() => opened))

        expect(openAuthorizationPopup()).toBeNull()
      })
    }

    it('returns the popup when open succeeds', () => {
      const popup = makePopup()
      vi.stubGlobal('open', vi.fn(() => popup))

      expect(openAuthorizationPopup()).toBe(popup)
    })
  })

  describe('awaitAuthorizationResponse', () => {
    it('resolves with code/state on a valid message, mapping error_description to errorDescription', async () => {
      const popup = makePopup()
      const { authorizationResponse } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: OAUTH_MESSAGE_TYPE, code: 'the-code', state: 'the-state', error_description: 'oops' },
        origin: EXPECTED_ORIGIN,
        source: popup as any,
      }))

      const result = await authorizationResponse
      expect(result).toEqual({ code: 'the-code', state: 'the-state', error: undefined, errorDescription: 'oops' })
    })

    it('accepts a null source with the correct origin', async () => {
      const popup = makePopup()
      const { authorizationResponse } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: OAUTH_MESSAGE_TYPE, code: 'c', state: 's' },
        origin: EXPECTED_ORIGIN,
        source: null,
      }))

      await expect(authorizationResponse).resolves.toEqual({ code: 'c', state: 's', error: undefined, errorDescription: undefined })
    })

    const VALID_DATA = { type: OAUTH_MESSAGE_TYPE, code: 'c', state: 's' }
    for (const { name, data, origin, fromPopup } of [
      { name: 'from the wrong origin', data: VALID_DATA, origin: 'https://evil.example.com', fromPopup: true },
      { name: 'with a truthy source that is not the popup', data: VALID_DATA, origin: EXPECTED_ORIGIN, fromPopup: false },
      { name: 'missing a type', data: { code: 'c', state: 's' }, origin: EXPECTED_ORIGIN, fromPopup: true },
      { name: 'with the wrong type', data: { ...VALID_DATA, type: 'some-other-type' }, origin: EXPECTED_ORIGIN, fromPopup: true },
      { name: 'whose data is not an object', data: 'just a string', origin: EXPECTED_ORIGIN, fromPopup: true },
      { name: 'whose state is not a string', data: { ...VALID_DATA, state: 123 }, origin: EXPECTED_ORIGIN, fromPopup: true },
    ]) {
      it(`ignores a message ${name}`, async () => {
        const popup = makePopup()
        const { authorizationResponse } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

        window.dispatchEvent(new MessageEvent('message', { data, origin, source: (fromPopup ? popup : makePopup()) as any }))

        expect(await isStillPending(authorizationResponse)).toBe(true)
      })
    }

    it('rejects with the closed message when the popup is closed by the user before any message', async () => {
      vi.useFakeTimers()
      const popup = makePopup()
      const { authorizationResponse } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      const assertion = expect(authorizationResponse).rejects.toThrow('closed before returning an authorization code')
      popup.closed = true
      await vi.advanceTimersByTimeAsync(POPUP_POLL_MS + 100)

      await assertion
    })

    it('adds a Cross-Origin-Opener-Policy hint when window.crossOriginIsolated is true', async () => {
      vi.useFakeTimers()
      vi.stubGlobal('crossOriginIsolated', true)
      const popup = makePopup()
      const { authorizationResponse } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      const assertion = expect(authorizationResponse).rejects.toThrow('Cross-Origin-Opener-Policy')
      popup.closed = true
      await vi.advanceTimersByTimeAsync(POPUP_POLL_MS + 100)

      await assertion
    })

    it('rejects with the timeout message after the timeout elapses with no message and no close', async () => {
      vi.useFakeTimers()
      const popup = makePopup()
      const { authorizationResponse } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      const assertion = expect(authorizationResponse).rejects.toThrow('Sign-in timed out')
      await vi.advanceTimersByTimeAsync(FLOW_TIMEOUT_MS + 10)

      await assertion
    })

    it('removes the listener after resolving, so a second message has no effect', async () => {
      const popup = makePopup()
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const { authorizationResponse } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: OAUTH_MESSAGE_TYPE, code: 'first', state: 's' },
        origin: EXPECTED_ORIGIN,
        source: popup as any,
      }))

      const result = await authorizationResponse
      expect(result.code).toBe('first')
      expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function))

      // A second, otherwise-valid message must not change anything - the listener is gone.
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: OAUTH_MESSAGE_TYPE, code: 'second', state: 's' },
        origin: EXPECTED_ORIGIN,
        source: popup as any,
      }))

      await expect(authorizationResponse).resolves.toEqual(result)
    })

    it('cancel() removes the listener and rejects the promise with FLOW_CANCELLED', async () => {
      const popup = makePopup()
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const { authorizationResponse, cancel } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      const assertion = expect(authorizationResponse).rejects.toThrow(FLOW_CANCELLED)
      cancel()

      await assertion
      expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function))
    })

    it('attempts popup.close() on a terminal path', async () => {
      const popup = makePopup()
      const { authorizationResponse, cancel } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      cancel()
      await authorizationResponse.catch(() => {})

      expect(popup.close).toHaveBeenCalledTimes(1)
    })
  })
})
