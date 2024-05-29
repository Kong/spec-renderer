<template>
  <div data-testid="endpoint-body-content-list">
    <h4>Body</h4>

    <p v-if="description">
      {{ description }}
    </p>

    <template
      v-for="content in contents"
      :key="content.id"
    >
      <ModelNode
        v-if="content.schema"
        :data="parseSchema(content.schema)"
        :title="content.schema.title ?? defaultModelTitle"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IMediaTypeContent } from '@stoplight/types'
import ModelNode from '../ModelNode.vue'
import type { SchemaObject } from '@/types'
import { removeFieldsFromSchemaObject } from '@/utils'

const props = defineProps({
  description: {
    type: String,
    default: '',
  },
  contents: {
    type: Array as PropType<Array<IMediaTypeContent>>,
    required: true,
  },
  defaultModelTitle: {
    type: String,
    default: 'Request Body Schema Model',
  },
  readonlyVisible: {
    type: Boolean,
    default: true,
  },
})

function parseSchema(schema: SchemaObject) {
  return props.readonlyVisible ? schema : removeFieldsFromSchemaObject(schema)
}
</script>
