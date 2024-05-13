import type { App } from 'vue'
import SpecRenderer from '@/components/SpecRenderer.vue'
import SpecDocument from './components/spec-document/SpecDocument.vue'
import SpecRendererToc from './components/spec-renderer-toc/SpecRendererToc.vue'
import SpecRendererTryMe from './components/spec-renderer-try-me/SpecRendererTryMe.vue'

// Export Vue plugin as the default
export default {
  // Customize Vue plugin options as desired
  // Providing a `name` property allows for customizing the registered
  // name of your component (useful if exporting a single component).
  install: (app: App, options: { name?: string, [key: string]: any } = {}): void => {
    // Globally register the KonnectAppShell component
    app.component(options.name || 'SpecRenderer', SpecRenderer)
  },
}

export * from './utils'
export * from './types'

// exporting components
export {
  SpecRenderer,
  SpecDocument,
  SpecRendererToc,
  SpecRendererTryMe,
}
