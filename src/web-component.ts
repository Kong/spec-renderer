import { defineCustomElement } from 'vue'
import SpecRenderer from '@/components/SpecRenderer.vue'
import SpecDocument from './components/spec-document/SpecDocument.vue'
import SpecRendererToc from './components/spec-renderer-toc/SpecRendererToc.vue'
import SchemaRenderer from './components/extra-renderers/SchemaRenderer.vue'

// Re-export everything from index
export * from './index'

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

  if (!customElements.get('kong-schema-renderer')) {
    const schemaRendererCustomElement = defineCustomElement(SchemaRenderer)
    customElements.define('kong-schema-renderer', schemaRendererCustomElement)
  }

  console.log('elements registered')
}

// Auto-register the function to the window object
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.registerKongSpecRenderer = registerKongSpecRenderer
}

registerKongSpecRenderer()
