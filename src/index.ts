import type { App } from 'vue'
import SpecRenderer from '@/components/SpecRenderer.vue'
import DocumentComponent from './components/document/DocumentComponent.vue'
import TableOfContents from './components/table-of-contents/TableOfContents.vue'
import TryMe from './components/try-me/TryMe.vue'

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

export {
  SpecRenderer,
  DocumentComponent,
  TableOfContents,
  TryMe,
}
