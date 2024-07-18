<template>
  <div class="content-list-item-schema">
    <!-- eslint-disable vue/no-v-html -->
    <p
      v-if="renderedDescription"
      class="content-list-item-schema-description"
      v-html="renderedDescription"
    />
    <!-- eslint-enable vue/no-v-html -->
    <ModelNode
      :schema="schema"
      :title="schema.title"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'
import useMarkdown from '@/composables/useMarkdown'
import ModelNode from '../schema-model/ModelNode.vue'

const props = defineProps({
  schema: {
    type: Object as PropType<SchemaObject>,
    required: true,
  },
})

const { mdRender } = useMarkdown()
const renderedDescription = computed(() =>
  props.schema.description ? mdRender(props.schema.description) : '',
)
</script>

<style lang="scss" scoped>
.content-list-schema {
  .content-list-schema-description {
    margin-bottom: var(--kui-space-40, $kui-space-40);
  }
}
</style>
