<template>
  <li
    class="label-item"
    data-testid="label-item"
  >
    {{ item.title }}
  </li>
</template>

<script setup lang="ts">
import type { TableOfContentsLabel } from '@/stoplight/elements-core'

defineProps<{
  item: TableOfContentsLabel
}>()
</script>

<style lang="scss" scoped>
.label-item {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  line-height: var(--kui-line-height-20, $kui-line-height-20);
  list-style-type: none;
  padding: var(--kui-space-30, $kui-space-30) var(--kui-space-30, $kui-space-30) var(--kui-space-0, $kui-space-0);
  text-transform: uppercase;

  &:not(:first-child) {
    margin-top: var(--kui-space-30, $kui-space-30);
  }
}
</style>
