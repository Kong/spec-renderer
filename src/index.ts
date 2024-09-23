import type { App } from 'vue'
import SpecRenderer from '@/components/SpecRenderer.vue'
import SpecDocument from './components/spec-document/SpecDocument.vue'
import SpecRendererToc from './components/spec-renderer-toc/SpecRendererToc.vue'
import { defineCustomElement } from 'vue'
//import registerCustomElement from './utils/register-custom-element'
import * as elements from './elements'


// Export Vue plugin as the default
export default {
  install: (app: App): void => {
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
export function registerKongSpecRenderer(): void {

  const specRendererCustomElement = defineCustomElement(elements.KongSpecRenderer)
  if (!customElements.get('kong-spec-renderer')) {
    customElements.define('kong-spec-renderer', specRendererCustomElement)
  }
}



// Auto-register the function to the window object
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.registerKongSpecRenderer = registerKongSpecRenderer
}
