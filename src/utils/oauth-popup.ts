// Pop-up transport for the OAuth2 PKCE flow: opens the callback pop-up and carries the
// authorization response back from it. `@kong/spec-renderer` cannot host its own OAuth
// callback page (it's embedded at an arbitrary route in a host app), so the host serves
// one and passes its URL in. That page reads `?code&state` and `postMessage`s them to
// `window.opener` - this module is the opener side plus the window-opening.

import { isSsr } from './ssr'
import type { AuthorizationResponseParams } from '@/types'

// ─── Constants ─────────────────────────────────────────────────────────────────

export const OAUTH_MESSAGE_TYPE = 'kong-spec-renderer:oauth-callback'
export const POPUP_NAME = 'kong-spec-renderer-oauth'
export const POPUP_WIDTH = 600
export const POPUP_HEIGHT = 760
export const POPUP_POLL_MS = 500
export const FLOW_TIMEOUT_MS = 5 * 60_000

// ─── Opening the pop-up ──────────────────────────────────────────────────────────

/**
 * Open the OAuth pop-up window, synchronously, with no navigation yet.
 *
 * MUST be called synchronously from inside a click handler and MUST NOT await anything
 * before calling `window.open`. The whole flow needs a PKCE code challenge, which
 * requires `crypto.subtle.digest` - an async call. `await digest(); window.open(url)`
 * loses the user-activation flag that came from the click by the time `window.open`
 * runs, so Safari blocks it outright and Firefox blocks it intermittently. Opening
 * `about:blank` (an empty URL) here, synchronously, keeps the activation; a separate
 * function (`navigateAuthorizationPopup`) navigates the already-open window once the
 * challenge is ready.
 */
export const openAuthorizationPopup = (): Window | null => {
  if (isSsr()) {
    return null
  }

  const width = POPUP_WIDTH
  const height = POPUP_HEIGHT

  // Defensive reads: `screenLeft`/`outerWidth` are all widely supported but not
  // guaranteed, so fall back and clamp to avoid negative/NaN positions.
  const screenLeft = window.screenLeft ?? window.screenX ?? 0
  const screenTop = window.screenTop ?? window.screenY ?? 0
  const outerWidth = window.outerWidth || document.documentElement.clientWidth || POPUP_WIDTH
  const outerHeight = window.outerHeight || document.documentElement.clientHeight || POPUP_HEIGHT

  const left = Math.max(0, screenLeft + (outerWidth - width) / 2)
  const top = Math.max(0, screenTop + (outerHeight - height) / 2)

  // Never add `noopener`/`noreferrer` here - they sever `window.opener` in the pop-up,
  // which is exactly the channel the callback page uses to post the response back.
  // A well-meaning security pass adding either of those breaks the entire flow silently
  // (the pop-up just opens and never reports back).
  const features = `popup=1,width=${width},height=${height},left=${left},top=${top},resizable=1,scrollbars=1,status=1`

  const popup = window.open('', POPUP_NAME, features)

  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    return null
  }

  return popup
}

/**
 * Navigate an already-open pop-up (from `openAuthorizationPopup`) to the real
 * authorize URL, once the PKCE challenge has been computed.
 */
export const navigateAuthorizationPopup = (popup: Window, authorizeUrl: string): void => {
  try {
    // `location.replace`, not `location.href = ...`: it creates no history entry in the
    // pop-up (so the user can't hit Back into `about:blank`), and it's one of the few
    // `Location` members still accessible cross-origin once the pop-up navigates to the
    // authorization server's origin.
    popup.location.replace(authorizeUrl)
  } catch (error) {
    throw new Error(`Failed to navigate the authorization pop-up: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// ─── Awaiting the callback ───────────────────────────────────────────────────────

export interface AwaitAuthorizationResponseOptions {
  timeoutMs?: number
  pollMs?: number
}

export interface AwaitAuthorizationResponseResult {
  promise: Promise<AuthorizationResponseParams>
  cancel: () => void
}

/**
 * Wait for the callback pop-up to `postMessage` its authorization response back.
 *
 * Returns `{ promise, cancel }` rather than a bare promise so the caller can tear the
 * flow down (e.g. the host component unmounts, or the user cancels explicitly).
 */
export const awaitAuthorizationResponse = (
  popup: Window,
  expectedOrigin: string,
  options?: AwaitAuthorizationResponseOptions,
): AwaitAuthorizationResponseResult => {
  const timeoutMs = options?.timeoutMs ?? FLOW_TIMEOUT_MS
  const pollMs = options?.pollMs ?? POPUP_POLL_MS

  // Populated once the executor below runs; `cancel()` just forwards to it.
  let cancelImpl = (): void => {}

  const promise = new Promise<AuthorizationResponseParams>((resolve, reject) => {
    let settled = false
    let pollHandle: ReturnType<typeof setInterval> | undefined
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined

    // Idempotent teardown, run on every terminal path (resolve, reject, cancel) -
    // never settles the promise itself, only releases listeners/timers/the pop-up.
    const doCleanup = (): void => {
      if (pollHandle !== undefined) {
        clearInterval(pollHandle)
        pollHandle = undefined
      }
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle)
        timeoutHandle = undefined
      }
      window.removeEventListener('message', onMessage)
      try {
        // COOP can make `close()` throw on a cross-origin pop-up; closing is best-effort.
        popup.close()
      } catch {
        // ignore
      }
    }

    const finish = (settle: () => void): void => {
      if (settled) {
        return
      }
      settled = true
      doCleanup()
      settle()
    }

    const onMessage = (event: MessageEvent): void => {
      // Never log `event` or `event.data` - it can carry a live authorization code.
      if (event.origin !== expectedOrigin) {
        return
      }

      // Accept an absent/null `source`: Cross-Origin-Opener-Policy on either page, or
      // the pop-up having already closed by the time the message is processed, both
      // null it out. Only ignore a `source` that is present AND doesn't match the
      // pop-up we opened.
      if (event.source && event.source !== popup) {
        return
      }

      const data: unknown = event.data
      if (typeof data !== 'object' || data === null) {
        return
      }

      const message = data as Record<string, unknown>
      if (message.type !== OAUTH_MESSAGE_TYPE) {
        return
      }

      const state = message.state
      if (typeof state !== 'string') {
        return
      }

      // Narrowed fields are captured into locals before the closure below - TS control
      // flow narrowing on `message.x` doesn't survive crossing into a nested function.
      const code = typeof message.code === 'string' ? message.code : undefined
      const error = typeof message.error === 'string' ? message.error : undefined
      const errorDescription = typeof message.error_description === 'string' ? message.error_description : undefined

      finish(() => resolve({ code, state, error, errorDescription }))
    }

    // Raw `addEventListener`, not `useEventListener` from `@vueuse/core`: the calling
    // component can be unmounted mid-sign-in (`SpecDocument.vue` unmounts operations as
    // the user scrolls past them via `toRenderer[idx]`), which would dispose an
    // effect-scope-bound listener while the flow is still live. This module owns its
    // own teardown instead of relying on a component's lifecycle.
    window.addEventListener('message', onMessage)

    // Plain `setInterval`/`setTimeout`, not the `@vueuse/core` helpers, for the same
    // effect-scope-independence reason as the listener above.
    pollHandle = setInterval(() => {
      if (popup.closed) {
        finish(() => reject(new Error('popup-closed')))
      }
    }, pollMs)

    timeoutHandle = setTimeout(() => {
      finish(() => reject(new Error('timeout')))
    }, timeoutMs)

    cancelImpl = () => finish(() => reject(new Error('cancelled')))
  })

  return {
    promise,
    cancel: () => cancelImpl(),
  }
}
