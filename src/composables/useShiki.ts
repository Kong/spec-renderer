import type { Ref, DeepReadonly } from 'vue'
import { shallowRef, readonly } from 'vue'
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import type { HighlighterCore } from 'shiki/core'


// Shiki is an opaque stateful service; Vue must not proxy its internal maps.
const shikiInstance = shallowRef<HighlighterCore>()
let highlighterPromise: Promise<HighlighterCore> | undefined

export default function useShiki(): {
  highlighter: DeepReadonly<Ref<HighlighterCore | undefined>>
  createHighlighter: () => Promise<void>
} {

  const createHighlighter = async (): Promise<void> => {

    if (shikiInstance.value) return

    // Several renderer instances can mount in the same tick. Reuse the in-flight
    // initialization so language grammars and the WASM engine are loaded once.
    highlighterPromise ??= createHighlighterCore({
      themes: [
        import('shiki/themes/catppuccin-latte.mjs'),
        import('shiki/themes/catppuccin-mocha.mjs'),
      ],
      langs: [
        import('shiki/langs/java.mjs'),
        import('shiki/langs/javascript.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/python.mjs'),
        import('shiki/langs/go.mjs'),
        import('shiki/langs/ruby.mjs'),
        import('shiki/langs/fish.mjs'),
        import('shiki/langs/csharp.mjs'),
      ],
      // Important: If running in SSR, the host application must have a `shiki/onig.wasm` file available at the root of the assets. If in new Konnect Dev Portal, this is already handled.
      engine: createOnigurumaEngine(() => {
        // @ts-ignore - Checking for SSR
        if (!import.meta.server) {
          // @ts-ignore - in client, use the wasm loader
          return import('shiki/wasm?init')
        } else {
          // @ts-ignore - Use externalized import to support rendering via SSR. The Vite Ignore comment is to prevent Vite from trying to resolve the import in the standalone spec renderer
          return import(/* @vite-ignore */ 'shiki/onig.wasm')
        }
      }),
    })

    try {
      shikiInstance.value = await highlighterPromise
    } catch (error) {
      // Allow a later mount to retry after a transient loading failure.
      highlighterPromise = undefined
      throw error
    }
  }

  return {
    highlighter: readonly(shikiInstance),
    createHighlighter,
  }
}
