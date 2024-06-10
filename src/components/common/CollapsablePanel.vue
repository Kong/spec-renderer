
<template>
  <div class="collapsable-panel">
    <div class="panel-header">
      <slot name="header" />
    </div>
    <!-- TODO ADD expand/collapse/copy content-->
    <div
      v-if="$slots.default"
      v-show="!isCollapsed"
      class="panel-body"
    >
      <slot name="default" />
    </div>

    <div
      v-if="$slots.left && $slots.right"
      v-show="!isCollapsed"
      class="panel-body two-columns"
    >
      <div class="left">
        <slot name="left" />
      </div>
      <div class="right">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isCollapsed = ref<boolean>(false)
</script>

<style lang="scss" scoped>
.collapsable-panel {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  margin-top: $kui-space-40!important;

  .panel-header {
    background-color: $kui-color-background;
    display: flex;
    align-items: center;
    padding: $kui-space-40;

    :deep(>h5) {
      color: $kui-color-text;
      margin-left: $kui-space-30;
      padding: 0;
    }
  }

  .panel-body {
    background-color: $kui-color-background-neutral-weakest;
    border-top: $kui-border-width-10 solid $kui-color-border;
    width: 100%;
    &.two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;

      .left,
      .right {
        display: flex;
        flex-direction: column;
        margin: $kui-space-50 $kui-space-40;
      }
    }
  }

  @media (max-width: $kui-breakpoint-mobile) {
    .panel-body {
      &.two-columns {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>