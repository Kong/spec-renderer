import type { App } from 'vue'
import SpecRenderer from '@/components/SpecRenderer.vue'
import SpecDocument from './components/spec-document/SpecDocument.vue'
import SpecRendererToc from './components/spec-renderer-toc/SpecRendererToc.vue'
import registerCustomElement from './utils/register-custom-element'
import * as elements from './elements'

import type { KongSpecRendererOptions } from './types'

export type { KongSpecRendererOptions }

// Export Vue plugin as the default
export const KongSpecRendererPlugin = {
  install: (app: App, options: KongSpecRendererOptions): void => {
    // Provide option values to components
    app.provide('shadow-dom', options.shadowDom)
    app.provide('inject-css', options?.injectCss)
    // Register All Elements
    for (const key in elements) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      app.component(key, elements[key])
    }
  },
}

// we need to expose refs to parsed document/toc and parseSpecDocument method to outside word
export * from './utils/schema-parser'

// those are types that used in properties of components exposed to outside word
export type { ServiceNode, NavigationTypes, ParseOptions } from './types'
export type { TableOfContentsItem } from '@kong/stoplight-http-spec/elements-core'

// expose components
export {
  SpecRenderer,
  SpecDocument,
  SpecRendererToc,
}

// Exports a function that registers all custom elements as native web components
export default function registerKongSpecRendererNativeElements(options?: KongSpecRendererOptions): void {
  const userOptions = Object.assign({}, options)

  // Since we are registering custom elements as native web components, force options.shadowDom to true only if undefined
  userOptions.shadowDom = options?.shadowDom !== undefined ? options.shadowDom : true

  registerCustomElement('kong-spec-renderer', elements.KongSpecRenderer, userOptions)
}



// Auto-register the function to the window object
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.registerKongSpecRendererNativeElements = registerKongSpecRendererNativeElements
}
