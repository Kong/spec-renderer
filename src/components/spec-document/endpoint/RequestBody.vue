<template>
  <CollapsibleSection
    class="endpoint-body-content-list"
    title="Body"
  >
    <BodyContentList
      :contents="contents"
      :description="description"
      :readonly-visible="readonlyVisible"
    />
  </CollapsibleSection>
</template>

<script setup lang="ts">
import type { IMediaTypeContent } from '@stoplight/types'
import type { PropType } from 'vue'
import CollapsibleSection from './CollapsibleSection.vue'
import BodyContentList from './BodyContentList.vue'

defineProps({
  description: {
    type: String,
    default: '',
  },
  contents: {
    type: Array as PropType<Array<IMediaTypeContent>>,
    required: true,
  },
  readonlyVisible: {
    type: Boolean,
    default: true,
  },
})
</script>

