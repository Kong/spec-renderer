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
        :data="content.schema"
        :readonly-visible="readonlyVisible"
        :title="content.schema.title ?? defaultModelTitle"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import ModelNode from '../ModelNode.vue'
import type { IMediaTypeContent } from '@stoplight/types'

defineProps({
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
</script>
