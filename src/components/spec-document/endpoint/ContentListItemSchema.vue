<template>
  <div class="content-list-item-schema">
    <MarkdownRenderer
      v-if="schema.description"
      class="content-list-item-schema-description"
      :markdown="schema.description"
    />
    <ModelNode
      :schema="schema"
      :title="schema.title"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'
import ModelNode from '../schema-model/ModelNode.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'

defineProps({
  schema: {
    type: Object as PropType<SchemaObject>,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.content-list-item-schema {
  .content-list-item-schema-description {
    margin-bottom: var(--kui-space-40, $kui-space-40);
  }
}
</style>
