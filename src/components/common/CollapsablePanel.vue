<template>
  <div class="collapsable-panel">
    <div class="panel-header">
      <slot name="header" />
    </div>
    <!-- TODO ADD expand/collapse/copy content-->
    <div
      v-show="!isCollapsed"
      class="panel-body"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isCollapsed = ref<boolean>(false)
</script>

<style lang="scss" scoped>
.collapsable-panel {
  border: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  margin-top: var(--kui-space-40, $kui-space-40)!important;

  .panel-header {
    align-items: center;
    background-color: var(--kui-color-background, $kui-color-background);
    display: flex;
    padding: var(--kui-space-40, $kui-space-40);

    :deep(>h5) {
      color: var(--kui-color-text, $kui-color-text);
      padding: var(--kui-space-0, $kui-space-0);
    }
  }

  .panel-body {
    background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border-top: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;

    :deep(.short) {
      display: flex;
      flex-direction: column;
      margin: var(--kui-space-50, $kui-space-50) var(--kui-space-40, $kui-space-40);
    }

    :deep(.wide) {
      display: flex;
      flex-direction: column;
      grid-column: 1 / 3;
      margin: var(--kui-space-50, $kui-space-50) var(--kui-space-40, $kui-space-40);
    }
  }

  @media (max-width: ($kui-breakpoint-mobile - 1px)) {
    .panel-body {
      grid-template-columns: 1fr;
      :deep(.wide) {
        grid-column: 1;
      }
    }
  }
}
</style>