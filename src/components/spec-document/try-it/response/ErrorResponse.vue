<template>
  <div class="error-panel">
    {{ errorText }}
    <div
      v-if="!response"
      class="cors-error"
    >
      Make sure CORS is enabled for the server.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  responseError: {
    type: Object as PropType<Error>,
    default: () => ({}),
  },
  response: {
    type: Object as PropType<Response>,
    default: undefined,
  },
})

const errorText = computed((): string => props.responseError?.message || '')
</script>

<style lang="scss" scoped>
.error-panel {
  background-color: var(--kui-color-background-danger-weakest, $kui-color-background-danger-weakest);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  color: var(--kui-color-text-danger, $kui-color-text-danger);
  font-family: var(--kui-font-family-code, $kui-font-family-code);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  padding: var(--kui-space-30, $kui-space-30) var(--kui-space-40, $kui-space-40);

  .cors-error {
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}
</style>
