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
import TableOfContents from './table-of-contents/TableOfContents.vue'
import DocumentComponent from './document/DocumentComponent.vue'
import TryMe from './try-me/TryMe.vue'

const props = defineProps({
  spec: {
    type: String,
    required: true,
  },
  basePath: {
    type: String,
    default: '',
  },
  controlBrowserUrl: {
    type: Boolean,
    default: true,
  },
})

// TODO: introduce and handle isParsed. show parsing state while parsing
const { parse, parsedDocument, jsonDocument, tableOfContents, validationResults } = composables.useSchemaParser()

const selectedPath = ref<string>('/')

const itemSelected = (id: any) => {
  //  console.log('itemSelected:', id)
  selectedPath.value = id
}

watch(() => (props.spec), async (unparsedSpecText: string) => {
  await parse(unparsedSpecText)

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
