import type { PreRequestAuthHandler, PreRequestAuthResult } from '@/types'

// Keyed by scheme key. Written only from onMounted, so never during SSR.
// Many operations share a scheme key; last mount wins, which is fine as all handlers read the same global state.
const handlers = new Map<string, PreRequestAuthHandler>()

// Handlers return either a raw Response or an PreRequestAuthResult, so tell them apart.
// instanceof is not enough: the try-it specs use hand-rolled Response doubles.
const isResponseLike = (value: object): value is Response =>
  (typeof Response !== 'undefined' && value instanceof Response) ||
  typeof (value as Response).status === 'number' ||
  typeof (value as Response).json === 'function'

export default function usePreRequestAuth() {
  const registerPreRequestAuth = (schemeKey: string, handler: PreRequestAuthHandler): void => {
    handlers.set(schemeKey, handler)
  }

  const unregisterPreRequestAuth = (schemeKey: string): void => {
    handlers.delete(schemeKey)
  }

  const runPreRequestAuth = async (schemeKeys: string[]): Promise<PreRequestAuthResult> => {
    let lastResponse: Response | undefined

    for (const schemeKey of schemeKeys) {
      const handler = handlers.get(schemeKey)
      if (!handler) {
        continue
      }

      let out: Response | PreRequestAuthResult | undefined
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
          // keep it so callers that need the raw token response can read it back
          lastResponse = out
          continue
        }
        return { ok: false, response: out }
      }

      const result = out as PreRequestAuthResult
      if (result.ok) {
        continue
      }
      return result
    }

    return lastResponse ? { ok: true, response: lastResponse } : { ok: true }
  }

  return { registerPreRequestAuth, unregisterPreRequestAuth, runPreRequestAuth }
}
