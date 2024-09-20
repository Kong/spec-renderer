import { inject } from 'vue'
import type { KongSpecRendererOptions } from '@/types'

// Wrap the inject functions in an object w/ functions so they can be
// stubbed in the component tests.
export const getConfigOptions = {
  shadowDom: (): boolean => inject('shadow-dom', false),
  injectCss: (): string[] => inject('inject-css', []),
}

export default function useConfigOptions(): KongSpecRendererOptions {
  const shadowDom = getConfigOptions.shadowDom()
  const injectCss = getConfigOptions.injectCss()

  return {
    shadowDom,
    injectCss,
  }
}
