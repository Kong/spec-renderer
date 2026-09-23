import { inject, onMounted, onUnmounted, provide } from 'vue'
import type { PreRequestAuthHandler, PreRequestAuthResult } from '@/types'

interface PreRequestAuthRegistry {
  registerHandler: (schemeKey: string, handler: PreRequestAuthHandler) => () => void
  runHandlers: (schemeKeys: string[]) => Promise<PreRequestAuthResult>
}

// One list per endpoint, so endpoints never touch each other's handlers.
// A list per scheme key, since a scheme that declares two flows renders two panels.
const createRegistry = (): PreRequestAuthRegistry => {
  const handlers = new Map<string, PreRequestAuthHandler[]>()

  const registerHandler = (schemeKey: string, handler: PreRequestAuthHandler): (() => void) => {
    handlers.set(schemeKey, [...(handlers.get(schemeKey) ?? []), handler])
    return () => {
      handlers.set(schemeKey, (handlers.get(schemeKey) ?? []).filter(h => h !== handler))
    }
  }

  // runs the handlers for these schemes in order, stopping at the first failure
  const runHandlers = async (schemeKeys: string[]): Promise<PreRequestAuthResult> => {
    for (const schemeKey of schemeKeys) {
      for (const handler of handlers.get(schemeKey) ?? []) {
        try {
          const result = await handler()
          if (!result.ok) {
            return result
          }
        } catch (error) {
          return { ok: false, error: error as Error }
        }
      }
    }
    return { ok: true }
  }

  return { registerHandler, runHandlers }
}

export default function usePreRequestAuth() {
  // Called by TryItAuth: gives the endpoint its own handler list and shares it with its flow panels.
  const providePreRequestAuth = (): PreRequestAuthRegistry => {
    const registry = createRegistry()
    provide<PreRequestAuthRegistry>('pre-request-auth', registry)
    return registry
  }

  // Called by flow panels during setup: the handler is active while the panel is mounted.
  const registerPreRequestAuth = (schemeKey: string, handler: PreRequestAuthHandler): void => {
    const registry = inject<PreRequestAuthRegistry | null>('pre-request-auth', null)
    if (!registry) {
      return
    }

    let unregister: (() => void) | undefined
    onMounted(() => {
      unregister = registry.registerHandler(schemeKey, handler)
    })
    onUnmounted(() => unregister?.())
  }

  return { providePreRequestAuth, registerPreRequestAuth }
}
