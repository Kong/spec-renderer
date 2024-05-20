<template>
  <div class="wrapper">
    <aside>
      <SpecRendererToc
        v-if="tableOfContents"
        :base-path="basePath"
        :control-browser-url="controlBrowserUrl"
        :path="currentPath"
        :table-of-contents="tableOfContents"
        @item-selected="itemSelected"
      />
    </aside>
    <div class="doc">
      <SpecDocument
        v-if="parsedDocument && selectedPath"
        :base-path="basePath"
        :document="parsedDocument"
        :json="jsonDocument"
        :path="currentPath"
      />
    </div>
    <div>
      <SpecRendererTryMe />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import composables from '../composables'
import SpecRendererToc from './spec-renderer-toc/SpecRendererToc.vue'
import SpecDocument from './spec-document/SpecDocument.vue'
import SpecRendererTryMe from './spec-renderer-try-me/SpecRendererTryMe.vue'

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
  selectedPath: {
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

const currentPath = ref<string>(props.selectedPath)

const itemSelected = (id: any) => {
  currentPath.value = id
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
  })
  if (props.traceParsing) {
    console.log('parsedDocument:', parsedDocument.value)
    console.log('tableOfContents:', tableOfContents.value)
    console.log('validationResults:', validationResults.value)
  }
}, { immediate: true })

</script>

<style lang="scss" scoped>
aside {
  display: flex;
  flex: 0 0 10%;
  height: 100%;
  overflow: visible;
  width: 320px;
}
.doc {
  flex: 1;
  overflow: visible;
  padding-left: var(--kui-space-60, $kui-space-60);
}
.wrapper {
  display: flex;
  height: 100vh;
}
</style>
./spec-document/DocumentComponent.vue
