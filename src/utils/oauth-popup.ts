// The sign-in popup: opens it, then waits for the host's callback page to post the identity provider's answer back.

import { isSsr } from './ssr'
import type { AuthorizationResponseParams, AwaitAuthorizationResponseResult } from '@/types'

export const OAUTH_MESSAGE_TYPE = 'kong-spec-renderer:oauth-callback'
export const POPUP_NAME = 'kong-spec-renderer-oauth'
export const POPUP_WIDTH = 600
export const POPUP_HEIGHT = 760
export const POPUP_POLL_MS = 500
export const FLOW_TIMEOUT_MS = 5 * 60_000
/** Rejection message for a flow cancelled from code. It's not the user's error, so callers ignore it. Namespaced: an identity-provider error string must never collide with it. */
export const FLOW_CANCELLED = 'kong-spec-renderer:flow-cancelled'

/**
 * Open an empty popup centred on the window, or return null when the browser blocked it.
 * Call it straight from the click, before any await, or the browser treats it as unrequested and blocks it.
 */
export const openAuthorizationPopup = (): Window | null => {
  if (isSsr()) {
    return null
  }

  const left = Math.max(0, window.screenX + (window.outerWidth - POPUP_WIDTH) / 2)
  const top = Math.max(0, window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2)
  // Never add noopener or noreferrer, they cut window.opener, which the callback page posts back through.
  // Accepted risk: an attacker-controlled authorizationUrl can then navigate the host window, with no cheap fix here.
  // Hosts rendering untrusted specs should vet the security scheme URLs before passing the spec in.
  const popup = window.open('', POPUP_NAME, `popup=1,width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=1,scrollbars=1`)
  // some blockers return a stub whose `closed` is undefined
  return popup?.closed === false ? popup : null
}

/**
 * Wait for the callback page to post the identity provider's answer back.
 * Rejects with a user-facing message when the popup closes or the sign-in times out.
 */
export const awaitAuthorizationResponse = (popup: Window, expectedOrigin: string): AwaitAuthorizationResponseResult => {
  let cancel = (): void => {}

  const authorizationResponse = new Promise<AuthorizationResponseParams>((resolve, reject) => {
    let settled = false
    const finish = (settle: () => void): void => {
      if (settled) {
        return
      }
      settled = true
      window.removeEventListener('message', onMessage)
      clearInterval(pollHandle)
      clearTimeout(timeoutHandle)
      try {
        popup.close()
      } catch {
        // COOP can make close() throw, closing is best effort
      }
      settle()
    }

    const onMessage = (event: MessageEvent): void => {
      // Never log the event, it can carry a live authorization code.
      // Origin first, then source. COOP can null the source, so only a different window is rejected.
      if (event.origin !== expectedOrigin || (event.source && event.source !== popup)) {
        return
      }
      const data: unknown = event.data
      if (typeof data !== 'object' || data === null) {
        return
      }
      const { type, state, code, error, error_description: errorDescription } = data as Record<string, unknown>
      const text = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined
      // Accept a stateless error too: a non-compliant provider can redirect with an error and no state,
      // and authorize() surfaces it instead of waiting out the timeout. A success still needs a valid state.
      if (type !== OAUTH_MESSAGE_TYPE || (typeof state !== 'string' && text(error) === undefined)) {
        // The message is not the expected OAuth response, ignore it.
        return
      }
      finish(() => resolve({ code: text(code), state: text(state), error: text(error), errorDescription: text(errorDescription) }))
    }

    // Plain listeners and timers, not vueuse ones tied to a component: a panel can unmount mid sign-in.
    window.addEventListener('message', onMessage)

    const pollHandle = setInterval(() => {
      if (!popup.closed) {
        return
      }
      let message = 'The sign-in window closed before returning an authorization code. If the identity provider showed an error, the redirect URI is most likely not registered for this client.'
      if (window.crossOriginIsolated === true) {
        message += ' This page sets a Cross-Origin-Opener-Policy that stops the sign-in window from reaching back; it must be served with Cross-Origin-Opener-Policy: same-origin-allow-popups.'
      }
      finish(() => reject(new Error(message)))
    }, POPUP_POLL_MS)

    const timeoutHandle = setTimeout(() => finish(() => reject(new Error('Sign-in timed out. Please try again.'))), FLOW_TIMEOUT_MS)

    // the executor runs synchronously, so this is set before the caller gets `cancel`
    cancel = () => finish(() => reject(new Error(FLOW_CANCELLED)))
  })

  return { authorizationResponse, cancel }
}
