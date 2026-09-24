// Pop-up transport for the OAuth2 PKCE flow:
// opens the callback popup and reads back the authorization response.
// The host app serves the callback page and passes its URL in; that page postMessages code and state to window.opener.

import { isSsr } from './ssr'
import type { AuthorizationResponseParams, AwaitAuthorizationResponseOptions, AwaitAuthorizationResponseResult } from '@/types'

export const OAUTH_MESSAGE_TYPE = 'kong-spec-renderer:oauth-callback'
export const POPUP_NAME = 'kong-spec-renderer-oauth'
export const POPUP_WIDTH = 600
export const POPUP_HEIGHT = 760
export const POPUP_POLL_MS = 500
export const FLOW_TIMEOUT_MS = 5 * 60_000

/**
 * Open the OAuth popup, synchronously, with no navigation yet.
 * Must run with no await before window.open, losing the click's user-activation gets it blocked by Safari/Firefox. Opens about:blank to preserve activation; navigateAuthorizationPopup navigates it later.
 */
export const openAuthorizationPopup = (): Window | null => {
  if (isSsr()) {
    return null
  }

  const width = POPUP_WIDTH
  const height = POPUP_HEIGHT

  // screenLeft/outerWidth aren't guaranteed, fall back and clamp to avoid negative/NaN positions.
  const screenLeft = window.screenLeft ?? window.screenX ?? 0
  const screenTop = window.screenTop ?? window.screenY ?? 0
  const outerWidth = window.outerWidth || document.documentElement.clientWidth || POPUP_WIDTH
  const outerHeight = window.outerHeight || document.documentElement.clientHeight || POPUP_HEIGHT

  const left = Math.max(0, screenLeft + (outerWidth - width) / 2)
  const top = Math.max(0, screenTop + (outerHeight - height) / 2)

  // Never add noopener/noreferrer here, they sever window.opener which the callback page needs to post the response back.
  const features = `popup=1,width=${width},height=${height},left=${left},top=${top},resizable=1,scrollbars=1,status=1`

  const popup = window.open('', POPUP_NAME, features)

  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    return null
  }

  return popup
}

/** Navigate an already-open popup (from openAuthorizationPopup) to the real authorize URL once the PKCE challenge is ready. */
export const navigateAuthorizationPopup = (popup: Window, authorizeUrl: string): void => {
  try {
    // location.replace, not location.href, avoids a history entry (no Back into about:blank) and stays accessible cross-origin after the popup navigates.
    popup.location.replace(authorizeUrl)
  } catch (error) {
    throw new Error(`Failed to navigate the authorization pop-up: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/** Wait for the callback popup to postMessage its response. Returns {promise, cancel} so the caller can tear the flow down. */
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

    // Idempotent teardown, run on every terminal path, never settles the promise, only releases listeners/timers/popup.
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
        // COOP can make close() throw on a cross-origin popup; closing is best-effort.
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
      // Never log event or event.data, it can carry a live authorization code.
      if (event.origin !== expectedOrigin) {
        return
      }

      // COOP or the popup already closing can null out event.source. Only ignore a source that IS present and doesn't match our popup.
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

      // Captured into locals first, TS narrowing on message.x doesn't survive crossing into the closure below.
      const code = typeof message.code === 'string' ? message.code : undefined
      const error = typeof message.error === 'string' ? message.error : undefined
      const errorDescription = typeof message.error_description === 'string' ? message.error_description : undefined

      finish(() => resolve({ code, state, error, errorDescription }))
    }

    // Raw addEventListener, not useEventListener from vueuse - a panel can unmount mid sign-in (e.g. switching security scheme).
    // Flow state lives in a module singleton, so this module owns its own teardown, not a component's lifecycle.
    window.addEventListener('message', onMessage)

    // Plain setInterval/setTimeout, not the vueuse helpers, for the same effect-scope-independence reason.
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
