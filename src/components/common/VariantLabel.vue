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
  color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
  display: inline-block;
  font-size: var(--kui-font-size-10, $kui-font-size-10);
  vertical-align: middle;
  // Limit to 3 characters on first line, so taht 'ONE OF' and 'ANY OF' have 'OF' on second line
  width: 3ch;
}
</style>
