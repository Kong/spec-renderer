<template>
  <code class="variant-label">
    {{ label }}
  </code>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.variant-label {
  background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
  display: inline-block;
  font: var(--kui-font-family-code, $kui-font-family-code);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  line-height: var(--kui-line-height-20, $kui-line-height-20);
  padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
}
</style>
