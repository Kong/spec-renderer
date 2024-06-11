<template>
  <details
    ref="overviewCollapsiblePanelDetail"
    class="overview-collapsible-panel"
  >
    <summary
      class="overview-collapsible-panel-header"
      @click="expanded = !expanded"
    >
      <ChevronRightIcon
        class="chevron-icon"
        :class="{ 'expanded': expanded }"
      />
      <span class="overview-collapsible-panel-header-title">{{ title }}</span>
    </summary>
    <div class="overview-collapsible-panel-content">
      <slot />
    </div>
  </details>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRightIcon } from '@kong/icons'

const expanded = ref(false)

defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss" scoped>
.overview-collapsible-panel {
  background-color: var(--kui-color-background, $kui-color-background);
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  overflow: auto;

  .overview-collapsible-panel-header {
    align-items: center;
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    cursor: default;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
    padding: var(--kui-space-40, $kui-space-40);

    .chevron-icon {
      @include chevron-toggle;
    }

    .overview-collapsible-panel-header-title {
      color: var(--kui-color-text, $kui-color-text);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    }
  }

  .overview-collapsible-panel-content {
    border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);

    padding: var(--kui-space-50, $kui-space-50) var(--kui-space-90, $kui-space-90);
  }
}
</style>
