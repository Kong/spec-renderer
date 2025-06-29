<template>
  <div class="content-list-item-schema">
    <PropertyFieldList
      :hidden-field-list="hiddenFields"
      :property="schema"
      :required-fields="schema.required"
    />
    <ModelNode
      :schema="schema"
      :title="schema.title"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { SchemaModelPropertyField, SchemaObject } from '@/types'
import ModelNode from '@/components/spec-document/schema-model/ModelNode.vue'
import PropertyFieldList from '@/components/spec-document/schema-model/PropertyFieldList.vue'

const { schema } = defineProps({
  schema: {
    type: Object as PropType<SchemaObject>,
    required: true,
  },
})

const hiddenFields = computed(() => {
  // example is already shown under the try-it section
  const list: SchemaModelPropertyField[] = ['example', 'examples']
  // If properties are present, we don't want to show the schema type
  if (schema.properties && Object.keys(schema.properties)?.length) {
    list.push('info')
  }
  return list
})
</script>
