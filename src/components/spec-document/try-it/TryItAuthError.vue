<template>
  <div
    class="error-panel"
    :data-testid="`tryit-auth-error-${dataId}`"
    role="alert"
  >
    {{ message }}
  </div>
</template>

<script setup lang="ts">
defineProps({
  message: {
    type: String,
    required: true,
  },
  dataId: {
    type: String,
    default: '',
  },
  kind: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss" scoped>
.error-panel {
  background-color: var(--kui-color-background-danger-weakest, $kui-color-background-danger-weakest);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  color: var(--kui-color-text-danger, $kui-color-text-danger);
  font-family: var(--kui-font-family-code, $kui-font-family-code);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  overflow-wrap: anywhere;
  padding: var(--kui-space-30, $kui-space-30) var(--kui-space-40, $kui-space-40);
  white-space: pre-wrap;
}
</style>
