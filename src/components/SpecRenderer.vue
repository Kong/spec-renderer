<template>
  <div class="wrapper">
    <aside>
      <SpecRendererToc
        v-if="tableOfContents"
        ref="specRendererTocRef"
        :base-path="basePath"
        class="spec-renderer-toc"
        :control-browser-url="controlBrowserUrl"
        :current-path="currentPath"
        :table-of-contents="tableOfContents"
        @item-selected="itemSelected"
      />
    </aside>
    <div class="doc">
      <SpecDocument
        v-if="parsedDocument && currentPath"
        :base-path="basePath"
        :current-path="currentPath"
        :document="parsedDocument"
        :hide-insomnia-try-it="hideInsomniaTryIt"
        :hide-try-it="hideTryIt"
        :json="jsonDocument"
        :spec-url="specUrl"
        @path-not-found="relayPathNotFound"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import composables from '../composables'
import SpecRendererToc from './spec-renderer-toc/SpecRendererToc.vue'
import SpecDocument from './spec-document/SpecDocument.vue'

const props = defineProps({
  /**
   * Text of the specification.
   */
  spec: {
    type: String,
    required: true,
  },
  /**
   * Path of the page where spec-renderer is loaded on. This is needed to compute path to individual specification details
   */
  basePath: {
    type: String,
    default: '',
  },
  /**
   * selected path to load document with
   */
  currentPath: {
    type: String,
    default: '/',
  },
  /**
   * URL to fetch spec document from
   */
  specUrl: {
    type: String,
    default: '',
  },
  /**
   * Allow component itself to control browser URL. When false it becomes the responsibility of consuming app
   */
  controlBrowserUrl: {
    type: Boolean,
    default: true,
  },
  /**
   * hide schemas from TOC
   */
  hideSchemas: {
    type: Boolean,
    default: false,
  },

  /**
   * hide internal endpoints from TOC
   */
  hideInternal: {
    type: Boolean,
    default: false,
  },
  /**
   * Do not show TryIt section
  */
  hideTryIt: {
    type: Boolean,
    default: false,
  },
  /**
     * Do not show  Insomnia option in TryIt
  */
  hideInsomniaTryIt: {
    type: Boolean,
    default: false,
  },
  /**
   * console out parsing process and stages
   */
  traceParsing: {
    type: Boolean,
    default: false,
  },
  /**
   * use withCredential instructions when fetching external (http) references during parsing
   */
  withCredentials: {
    type: Boolean,
    default: false,
  },
})

// TODO: introduce and handle isParsed. show parsing state while parsing
const { parseSpecDocument, parsedDocument, jsonDocument, tableOfContents, validationResults } = composables.useSchemaParser()

const currentPath = ref<string>(props.currentPath)

const itemSelected = (id: any) => {
  currentPath.value = id
}

const emit = defineEmits<{
  (e: 'path-not-found', requestedPath: string): void
}>()


const specRendererTocRef = ref<InstanceType<typeof SpecRendererToc> | null>(null)

/**
 * re-emits path-not-found event so application that consumes SpecRender component can handle 404
 */
const relayPathNotFound = (requestedPath: string): void => {
  emit('path-not-found', requestedPath)
}

watch(() => ({
  specUrl: props.specUrl,
  spec: props.spec,
  hideSchemas: props.hideSchemas,
  hideInternal: props.hideInternal,
}), async (changed, prev) => {

  // we want to reset currentPath if document changed. if new document is getting loadedm we want to keep the path
  if (prev && (changed.spec !== prev?.spec || changed.specUrl !== prev?.specUrl)) {
    currentPath.value = '/'
  }

  await parseSpecDocument(changed.spec, {
    hideSchemas: changed.hideSchemas,
    hideInternal: changed.hideInternal,
    traceParsing: props.traceParsing,
    ...(changed.specUrl ? { specUrl: changed.specUrl } : null),
    withCredentials: props.withCredentials,
    currentPath: currentPath.value,
  })
  if (props.traceParsing) {
    console.log('parsedDocument:', parsedDocument.value)
    console.log('tableOfContents:', tableOfContents.value)
    console.log('validationResults:', validationResults.value)
  }
}, { immediate: true })

/**
 * Once element is in the DOM, trigger scroll to active item in TOC.
 */
watch(specRendererTocRef, async (val) => {
  if (val?.$el?.scrollTo) {
    const scrollPosition = await val.getActiveItemScrollPosition()

    val.$el.scrollTo({
      top: scrollPosition - 50, // offset 50 so it doesn't stick to the top
    })
  }
})
</script>

<style lang="scss" scoped>
// TODO: change when implementing generic(responsive) SpecRender layout
aside {
  display: flex;
  flex-shrink: 0;
  height: 100%;
  overflow: visible;
  width: 320px;
}
.doc {
  flex: 1;
  overflow: visible;
  padding: var(--kui-space-60, $kui-space-60);
}
.wrapper {
  display: flex;
  height: 100vh;
}

/*
Styles for SpecRendererToc that need to live here so that they apply to the TOC
when it's rendered in the context of the SpecRenderer.
Otherwise host app should have control over these styles.
*/
.spec-renderer-toc {
  background-color: var(--kui-color-background, $kui-color-background);
  position: relative; // important, need this for scrolling to selected item

  :deep(>) {
    ul > *:first-child {
      // overview item
      padding: var(--kui-space-70, $kui-space-70);
      padding-bottom: var(--kui-space-0, $kui-space-0);
    }
  }

  :deep(.group-item) {
    &.root {
      padding-left: var(--kui-space-70, $kui-space-70);
      padding-right: var(--kui-space-70, $kui-space-70);
    }
  }
}
</style>
