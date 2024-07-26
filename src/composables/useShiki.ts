import type { Ref, DeepReadonly } from 'vue'
import { ref, readonly } from 'vue'
import { createHighlighterCore } from 'shiki/core'
import type { HighlighterCore } from 'shiki/core'


const shikiInstance = ref<HighlighterCore>()

export default function useShiki(): {
  highlighter: DeepReadonly<Ref<HighlighterCore | undefined>>,
  createHighlighter: () => Promise<void>
} {

  const createHighlighter = async (): Promise<void> => {

    shikiInstance.value = await createHighlighterCore({
      themes: [
        import('shiki/themes/material-theme-lighter.mjs'),
        import('shiki/themes/material-theme-palenight.mjs'),
      ],
      langs: [
        import('shiki/langs/java.mjs'),
        import('shiki/langs/javascript.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/python.mjs'),
        import('shiki/langs/go.mjs'),
        import('shiki/langs/ruby.mjs'),
        import('shiki/langs/fish.mjs'),
      ],
      // Important: If running in SSR, the host application must have a `shiki/onig.wasm` file available at the root of the assets. If in new Konnect Dev Portal, this is already handled.
      loadWasm: () => {
        // @ts-ignore - Checking for SSR
        if (!import.meta.server) {
          // @ts-ignore - in client, use the wasm loader
          return import('shiki/wasm?init')
        } else {
          // @ts-ignore - Use externalized import to support rendering via SSR. The Vite Ignore comment is to prevent Vite from trying to resolve the import in the standalone spec renderer
          return import(/* @vite-ignore */ 'shiki/onig.wasm')
        }
      },
    })
  }

  return {
    highlighter: readonly(shikiInstance),
    createHighlighter,
  }
}
