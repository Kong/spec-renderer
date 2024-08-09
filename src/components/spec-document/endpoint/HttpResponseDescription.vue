<template>
  <MarkdownRenderer
    v-if="description"
    class="http-response-description"
    :class="`response-code-${responseType}`"
    :markdown="responseDescription"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import { getResponseCodeKey } from '@/utils'

const props = defineProps({
  responseCode: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})

const responseType = computed(() => getResponseCodeKey(props.responseCode) )
const responseDescription = computed(() => {
  if (props.description) return props.description

  return `No content provided for response code ${props.responseCode}`
})
</script>

<style lang="scss" scoped>
.http-response-description {
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  max-width: fit-content;
  padding: var(--kui-space-30, $kui-space-30) var(--kui-space-40, $kui-space-40);

  &.response-code-2xx {
    background-color: var(--kui-color-background-success-weakest, $kui-color-background-success-weakest);
    color: var(--kui-color-text-success-strong, $kui-color-text-success-strong);
  }
  &.response-code-4xx {
    background-color: var(--kui-color-background-warning-weakest, $kui-color-background-warning-weakest);
    color: var(--kui-color-text-warning-strong, $kui-color-text-warning-strong);
  }
}
</style>
