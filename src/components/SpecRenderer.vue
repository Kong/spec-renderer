<template>
  <div>
    <TableOfContents
      v-if="tableOfContents"
      :table-of-contents="tableOfContents"
      @item-selected="itemSelected"
    />
    <Document
      v-if="parsedDocument && selectedPath"
      :document="parsedDocument"
      :json="jsonDocument"
      :path="selectedPath"
    />

    <TryMe />
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import composables from '../composables'
import TableOfContents from './TableOfContents/TableOfContents.vue'
import Document from './Document/Document.vue'
import TryMe from './TryMe/TryMe.vue'

const props = defineProps({
  spec: {
    type: String,
    required: true,
  },
})

// TODO: introduce and handle isParsed. show parsing state while parsing
const { parse, parsedDocument, jsonDocument, tableOfContents, validationResults } = composables.useSchemaParser()

const selectedPath = ref<string>('')

const itemSelected = (id: any) => {
  console.log('itemSelected:', id)
  selectedPath.value = id
}

watch(() => (props.spec), async (unparsedSpecText: string) => {
  await parse(unparsedSpecText)

  console.log('parsedDocument:', parsedDocument)
  console.log('tableOfContents:', tableOfContents.value)
  console.log('validationResults:', validationResults)

}, { immediate: true })

</script>
