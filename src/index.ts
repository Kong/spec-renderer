import type { App } from 'vue'
import SpecRenderer from '@/components/SpecRenderer.vue'
import SpecDocument from './components/spec-document/SpecDocument.vue'
import SpecRendererToc from './components/spec-renderer-toc/SpecRendererToc.vue'
import type { KongSpecRendererOptions } from './types'

// Export Vue plugin as the default
export default {
  // Customize Vue plugin options as desired
  // Providing a `name` property allows for customizing the registered
  // name of your component (useful if exporting a single component).
  install: (app: App, options: { name?: string, [key: string]: any } = {}): void => {
    // Register SpecRender component
    app.component(options.name || 'SpecRenderer', SpecRenderer)
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
