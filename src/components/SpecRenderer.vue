<template>
  <div class="wrapper">
    <aside>
      <TableOfContents
        v-if="tableOfContents"
        :base-path="basePath"
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

      <TryMe />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import composables from '../composables'
import TableOfContents from './TableOfContents/TableOfContents.vue'
import DocumentComponent from './Document/DocumentComponent.vue'
import TryMe from './TryMe/TryMe.vue'

const props = defineProps({
  spec: {
    type: String,
    required: true,
  },
  basePath: {
    type: String,
    default: '',
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
  flex: 1 0 10%;
  height: 100%;
  width: 320px;
}
.doc {
  display: flex;
}
.wrapper {
  display: flex;
  height: 100vh;
}
</style>
