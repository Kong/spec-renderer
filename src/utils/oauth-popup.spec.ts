import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  awaitAuthorizationResponse,
  FLOW_TIMEOUT_MS,
  navigateAuthorizationPopup,
  OAUTH_MESSAGE_TYPE,
  openAuthorizationPopup,
  POPUP_HEIGHT,
  POPUP_NAME,
  POPUP_WIDTH,
} from './oauth-popup'

// Fake pop-up: mirrors the subset of `Window` this module touches.
const makePopup = () => ({ closed: false, focus: vi.fn(), close: vi.fn(), location: { replace: vi.fn(), href: '' } })

const EXPECTED_ORIGIN = 'https://host.example.com'

// Race a promise against a resolved sentinel to assert it's still pending without
// hanging the test - used for every "ignored" message case below.
const isStillPending = async (promise: Promise<unknown>): Promise<boolean> => {
  const pending = Symbol('pending')
  const result = await Promise.race([promise.catch(() => pending), Promise.resolve(pending)])
  return result === pending
}

describe('oauth-popup', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  describe('openAuthorizationPopup', () => {
    it('calls window.open with an empty url, the popup name, and centred/sized features', () => {
      const openSpy = vi.fn(() => makePopup())
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
      const openSpy = vi.fn(() => makePopup())
      vi.stubGlobal('open', openSpy)

      openAuthorizationPopup()

      const features = openSpy.mock.calls[0]![2] as string
      expect(features).not.toContain('noopener')
      expect(features).not.toContain('noreferrer')
    })

    it('returns null when window.open returns undefined (jsdom default, and real blocking)', () => {
      // jsdom's window.open is unimplemented and returns undefined - this is also
      // exactly what a real browser returns when the popup was blocked.
      vi.stubGlobal('open', vi.fn())

      expect(openAuthorizationPopup()).toBeNull()
    })

    it('returns null when window.open returns null', () => {
      vi.stubGlobal('open', vi.fn(() => null))

      expect(openAuthorizationPopup()).toBeNull()
    })

    it('returns null when the returned window is already closed', () => {
      vi.stubGlobal('open', vi.fn(() => ({ ...makePopup(), closed: true })))

      expect(openAuthorizationPopup()).toBeNull()
    })

    it('returns the popup when open succeeds', () => {
      const popup = makePopup()
      vi.stubGlobal('open', vi.fn(() => popup))

      expect(openAuthorizationPopup()).toBe(popup)
    })
  })

  describe('navigateAuthorizationPopup', () => {
    it('calls location.replace with the exact url and does not touch href', () => {
      const popup = makePopup()

      navigateAuthorizationPopup(popup as unknown as Window, 'https://auth.example.com/authorize?x=1')

      expect(popup.location.replace).toHaveBeenCalledWith('https://auth.example.com/authorize?x=1')
      expect(popup.location.href).toBe('')
    })

    it('wraps a thrown error in a plain Error with a clear message', () => {
      const popup = makePopup()
      popup.location.replace = vi.fn(() => {
        throw new Error('boom')
      })

      expect(() => navigateAuthorizationPopup(popup as unknown as Window, 'https://auth.example.com')).toThrow(/Failed to navigate the authorization pop-up/)
    })
  })

  describe('awaitAuthorizationResponse', () => {
    it('resolves with code/state on a valid message, mapping error_description to errorDescription', async () => {
      const popup = makePopup()
      const { promise } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: OAUTH_MESSAGE_TYPE, code: 'the-code', state: 'the-state', error_description: 'oops' },
        origin: EXPECTED_ORIGIN,
        source: popup as any,
      }))

      const result = await promise
      expect(result).toEqual({ code: 'the-code', state: 'the-state', error: undefined, errorDescription: 'oops' })
    })

    it('accepts a null source with the correct origin', async () => {
      const popup = makePopup()
      const { promise } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: OAUTH_MESSAGE_TYPE, code: 'c', state: 's' },
        origin: EXPECTED_ORIGIN,
        source: null,
      }))

      await expect(promise).resolves.toEqual({ code: 'c', state: 's', error: undefined, errorDescription: undefined })
    })

    it('ignores a message from the wrong origin', async () => {
      const popup = makePopup()
      const { promise } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: OAUTH_MESSAGE_TYPE, code: 'c', state: 's' },
        origin: 'https://evil.example.com',
        source: popup as any,
      }))

      expect(await isStillPending(promise)).toBe(true)
    })

    it('ignores a message with a truthy source that is not the popup', async () => {
      const popup = makePopup()
      const otherWindow = makePopup()
      const { promise } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: OAUTH_MESSAGE_TYPE, code: 'c', state: 's' },
        origin: EXPECTED_ORIGIN,
        source: otherWindow as any,
      }))

      expect(await isStillPending(promise)).toBe(true)
    })

    it('ignores a message missing a type', async () => {
      const popup = makePopup()
      const { promise } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: { code: 'c', state: 's' },
        origin: EXPECTED_ORIGIN,
        source: popup as any,
      }))

      expect(await isStillPending(promise)).toBe(true)
    })

    it('ignores a message with the wrong type', async () => {
      const popup = makePopup()
      const { promise } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'some-other-type', code: 'c', state: 's' },
        origin: EXPECTED_ORIGIN,
        source: popup as any,
      }))

      expect(await isStillPending(promise)).toBe(true)
    })

    it('ignores a message whose data is not an object', async () => {
      const popup = makePopup()
      const { promise } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: 'just a string',
        origin: EXPECTED_ORIGIN,
        source: popup as any,
      }))

      expect(await isStillPending(promise)).toBe(true)
    })

    it('ignores a message whose state is not a string', async () => {
      const popup = makePopup()
      const { promise } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: OAUTH_MESSAGE_TYPE, code: 'c', state: 123 },
        origin: EXPECTED_ORIGIN,
        source: popup as any,
      }))

      expect(await isStillPending(promise)).toBe(true)
    })

    it('rejects with "popup-closed" when the popup is closed by the user before any message', async () => {
      vi.useFakeTimers()
      const popup = makePopup()
      const { promise } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      const assertion = expect(promise).rejects.toThrow('popup-closed')
      popup.closed = true
      await vi.advanceTimersByTimeAsync(600)

      await assertion
    })

    it('rejects with "timeout" after the timeout elapses with no message and no close', async () => {
      vi.useFakeTimers()
      const popup = makePopup()
      const { promise } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      const assertion = expect(promise).rejects.toThrow('timeout')
      await vi.advanceTimersByTimeAsync(FLOW_TIMEOUT_MS + 10)

      await assertion
    })

    it('removes the listener after resolving, so a second message has no effect', async () => {
      const popup = makePopup()
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const { promise } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: OAUTH_MESSAGE_TYPE, code: 'first', state: 's' },
        origin: EXPECTED_ORIGIN,
        source: popup as any,
      }))

      const result = await promise
      expect(result.code).toBe('first')
      expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function))

      // A second, otherwise-valid message must not change anything - the listener is gone.
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: OAUTH_MESSAGE_TYPE, code: 'second', state: 's' },
        origin: EXPECTED_ORIGIN,
        source: popup as any,
      }))

      await expect(promise).resolves.toEqual(result)
    })

    it('cancel() removes the listener and rejects the promise with "cancelled"', async () => {
      const popup = makePopup()
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const { promise, cancel } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      const assertion = expect(promise).rejects.toThrow('cancelled')
      cancel()

      await assertion
      expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function))
    })

    it('attempts popup.close() on a terminal path', async () => {
      const popup = makePopup()
      const { promise, cancel } = awaitAuthorizationResponse(popup as unknown as Window, EXPECTED_ORIGIN)

      cancel()
      await promise.catch(() => {})

      expect(popup.close).toHaveBeenCalledTimes(1)
    })
  })
})
