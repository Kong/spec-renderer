<template>
  <div class="overview-panel">
    <div class="overview-panel-header">
      <slot name="header">
        <div
          v-if="title"
          class="default-header"
        >
          <slot name="header-icon" />
          <span class="default-header-title">{{ title }}</span>
        </div>
      </slot>
    </div>
    <div class="overview-panel-content">
      <slot name="content" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss" scoped>
.overview-panel {
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-spec-renderer-panel-color-border, var(--kui-spec-renderer-color-border, var(--kui-color-border, $kui-color-border)));
  border-radius: var(--kui-spec-renderer-panel-border-radius, var(--kui-spec-renderer-border-radius, var(--kui-border-radius-30, $kui-border-radius-30)));
  overflow: auto;

  .overview-panel-header {
    background-color: var(--kui-spec-renderer-panel-header-color-background, var(--kui-spec-renderer-color-background-neutral, var(--kui-color-background, $kui-color-background)));
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-spec-renderer-panel-color-border, var(--kui-spec-renderer-color-border, var(--kui-color-border, $kui-color-border)));
    padding: var(--kui-space-50, $kui-space-50);

    .default-header {
      align-items: center;
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      display: flex;
      gap: var(--kui-space-40, $kui-space-40);

      .default-header-title {
        color: var(--kui-spec-renderer-panel-header-color-text, var(--kui-spec-renderer-color-text, var(--kui-color-text, $kui-color-text)));
        font-size: var(--kui-font-size-30, $kui-font-size-30);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        line-height: var(--kui-line-height-40, $kui-line-height-40);
      }
    }
  }

  .overview-panel-content {
    background-color: var(--kui-spec-renderer-panel-color-background-inset, var(--kui-spec-renderer-color-background-neutral, var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest)));
    padding: var(--kui-space-50, $kui-space-50);
  }
}
</style>
