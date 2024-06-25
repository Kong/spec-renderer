<template>
  <div class="wrapper">
    <h1>Spec Renderer Reusable Components Playground</h1>
    <div class="component-container">
      <h2>Tooltip</h2>
      <Tooltip text="This is a tooltip" />
      <hr>
      <label>
        Input label with tooltip
        <Tooltip
          id="input-tooltip"
          text="This is a label tooltip"
        />
      </label>
      <input
        aria-describedby="input-tooltip"
        type="text"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import Tooltip from '../../src/components/common/TooltipPopover.vue'
</script>

<style lang="scss" scoped>
.wrapper {
  gap: 12px;

  .component-container {
    width: 100%;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid lightgray;
  }
}
</style>