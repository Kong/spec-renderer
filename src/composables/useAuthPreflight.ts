import type { AuthPreflightHandler, AuthPreflightResult } from '@/types'

// Keyed by security-scheme key. Populated only from onMounted in flow components,
// so it is never written during SSR.
//
// SpecDocument.vue renders a `v-for` of operations gated by `toRenderer[idx]`, so many
// component instances can share one scheme key; the last mount wins the map slot. That is
// fine and desirable, because every instance's handler reads the same module-global auth state.
const handlers = new Map<string, AuthPreflightHandler>()

/**
 * Handlers may return either a raw `fetch` Response (the OAuth2 clientCredentials flow does)
 * or an `AuthPreflightResult` (the PKCE flow does), so they have to be told apart.
 * `instanceof` alone is not enough: the try-it specs build hand-rolled Response doubles
 * (see TryItResponse.spec.ts) because jsdom's Headers/Response are awkward. Discriminate on
 * members only a Response has - an AuthPreflightResult carries just ok/response/error.
 */
const isResponseLike = (value: object): value is Response =>
  (typeof Response !== 'undefined' && value instanceof Response) ||
  typeof (value as Response).status === 'number' ||
  typeof (value as Response).json === 'function'

export default function useAuthPreflight() {
  const registerPreflight = (schemeKey: string, handler: AuthPreflightHandler): void => {
    handlers.set(schemeKey, handler)
  }

  const unregisterPreflight = (schemeKey: string): void => {
    handlers.delete(schemeKey)
  }

  const runPreflight = async (schemeKeys: string[]): Promise<AuthPreflightResult> => {
    let lastResponse: Response | undefined

    for (const schemeKey of schemeKeys) {
      const handler = handlers.get(schemeKey)
      if (!handler) {
        continue
      }

      let out: Response | AuthPreflightResult | undefined
      try {
        out = await handler()
      } catch (error) {
        return { ok: false, error: error as Error }
      }

      if (!out) {
        continue
      }

      if (isResponseLike(out)) {
        if (out.ok) {
          // Carry the successful response through so callers that need the raw token
          // response (TryItAuth's `auth2ClientCredentialsAuth`) can read it back.
          lastResponse = out
          continue
        }
        return { ok: false, response: out }
      }

      const result = out as AuthPreflightResult
      if (result.ok) {
        continue
      }
      return result
    }

    return lastResponse ? { ok: true, response: lastResponse } : { ok: true }
  }

  return { registerPreflight, unregisterPreflight, runPreflight }
}
