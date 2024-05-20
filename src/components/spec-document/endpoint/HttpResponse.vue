<template>
  <details data-testid="endpoint-http-response">
    <summary>
      <span>{{ response.code }}</span>
      <p>{{ response.description }}</p>
    </summary>

    <BodyContentList
      v-if="Array.isArray(response.contents) && response.contents.length"
      :contents="response.contents"
      default-model-title="Response Body Schema Model"
    />
  </details>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperationResponse } from '@stoplight/types'
import BodyContentList from './BodyContentList.vue'

defineProps({
  response: {
    type: Object as PropType<IHttpOperationResponse>,
    required: true,
  },
})
</script>
