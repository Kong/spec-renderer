<template>
  <div class="wrapper">
    <aside>
      <TableOfContents
        v-if="tableOfContents"
        :base-path="basePath"
        :control-browser-url="props.controlBrowserUrl"
        :table-of-contents="tableOfContents"
        @item-selected="itemSelected"
      />
    </aside>
    <div class="doc">
      <DocumentComponent
        v-if="parsedDocument && selectedPath"
        :base-path="basePath"
        :document="parsedDocument"
        :json="jsonDocument"
        :path="selectedPath"
      />
    </div>
    <div>
      <TryMe />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import composables from '../composables'
import TableOfContents from './spec-renderer-toc/SpecRendererToc.vue'
import DocumentComponent from './spec-document/SpecDocument.vue'
import TryMe from './spec-renderer-try-me/SpecRendererTryMe.vue'

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
   * URL to fech spec document from
   */
  specUrl: {
    type: String,
    default: '',
  },
  /**
   * Allow component itelf to control browser URL. When false it becomes the responsibility of consuming app
   */
  controlBrowserUrl: {
    type: Boolean,
    default: true,
  },
})

// TODO: introduce and handle isParsed. show parsing state while parsing
const { parseSpecDocument, parsedDocument, jsonDocument, tableOfContents, validationResults } = composables.useSchemaParser()

const selectedPath = ref<string>('/')

const itemSelected = (id: any) => {
  selectedPath.value = id
}

watch(() => ({ spec: props.spec, url: props.specUrl }), async (changed) => {
  await parseSpecDocument(changed.spec, changed.url ? { specUrl: changed.url } : null)

  console.log('parsedDocument:', parsedDocument)
  console.log('tableOfContents:', tableOfContents.value)
  console.log('validationResults:', validationResults)

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
