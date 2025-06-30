import type { App } from 'vue'
import SpecRenderer from '@/components/SpecRenderer.vue'
import SpecDocument from './components/spec-document/SpecDocument.vue'
import SpecRendererToc from './components/spec-renderer-toc/SpecRendererToc.vue'
import SchemaRenderer from './components/extra-renderers/SchemaRenderer.vue'

// Export vue plugin as the default
export default {
  install: (app: App): void => {
    // Register All Elements
    app.component('KongSpecRenderer', SpecRenderer)
    app.component('KongSpecRendererToc', SpecRendererToc)
    app.component('KongSpecRendererDocument', SpecDocument)
    app.component('KongSchemaRenderer', SchemaRenderer)
  },
}

// We need to expose refs to parsed document/toc and parseSpecDocument method to outside word
export * from './utils/schema-parser'

// exporting findMatchingNode
export * from './utils/find-matching-node'

// These are types that used in properties of components exposed to outside word
export type { ServiceNode, NavigationTypes, ParseOptions, SchemaObject, ServiceChildNode, SpecRendererProps, SpecRendererNitroConfig } from './types'
export type { TableOfContentsItem } from '@/stoplight/elements-core'

// expose components
export {
  SpecRenderer,
  SpecDocument,
  SpecRendererToc,
  SchemaRenderer,
}
