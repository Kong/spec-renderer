import { getHighlighterCore } from 'shiki/core'
import type { HighlighterCore } from 'shiki/core'
import getWasm from 'shiki/wasm'

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
      loadWasm: getWasm,
    })
  }

  return {
    getHighlighter,
  }
}
