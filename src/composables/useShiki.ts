import { getHighlighterCore } from 'shiki/core'
import type { HighlighterCore } from 'shiki/core'

export default function useShiki() {

  const getHighlighter = async (): Promise<HighlighterCore> => {
    return await getHighlighterCore({
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
          // @ts-ignore - Use externalized import to support rendering via SSR
          return import(/* @vite-ignore */ 'shiki/onig.wasm')
        }
      },
    })
  }

  return {
    getHighlighter,
  }
}
