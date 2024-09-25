import type { App } from 'vue'
import SpecRenderer from '@/components/SpecRenderer.vue'
import SpecDocument from './components/spec-document/SpecDocument.vue'
import SpecRendererToc from './components/spec-renderer-toc/SpecRendererToc.vue'
import { defineCustomElement } from 'vue'


// Export Vue plugin as the default
export default {
  install: (app: App): void => {
    // Register All Elements
    app.component('KongSpecRenderer', SpecRenderer)
    app.component('KongSpecRendererToc', SpecRendererToc)
    app.component('KongSpecRendererDocument', SpecDocument)
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

  if (!customElements.get('kong-spec-renderer')) {
    const specRendererCustomElement = defineCustomElement(SpecRenderer)
    customElements.define('kong-spec-renderer', specRendererCustomElement)
  }

  if (!customElements.get('kong-spec-renderer-toc')) {
    const specRendererTocCustomElement = defineCustomElement(SpecRendererToc)
    customElements.define('kong-spec-renderer-toc', specRendererTocCustomElement)
  }

  if (!customElements.get('kong-spec-renderer-document')) {
    const specRendererDocumentCustomElement = defineCustomElement(SpecDocument)
    customElements.define('kong-spec-renderer-document', specRendererDocumentCustomElement)
  }
}

// Auto-register the function to the window object
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.registerKongSpecRenderer = registerKongSpecRenderer
}
