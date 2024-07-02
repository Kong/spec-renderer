<template>
  <div class="wrapper">
    <h1>Spec Renderer Reusable Components Playground</h1>
    <div class="component-container">
      <h2>Tooltip</h2>
      <Tooltip text="This is a tooltip" />
      <hr>
      <InputLabel
        for="sandbox-input"
        required
      >
        Input label with tooltip
        <Tooltip
          id="input-tooltip"
          text="This is a label tooltip"
        />
      </InputLabel>
      <input
        id="sandbox-input"
        aria-describedby="input-tooltip"
        autocomplete="off"
        placeholder="Text input"
        type="text"
      >
    </div>
    <div class="component-container">
      <h2>Tooltip</h2>
      <ToggleSwitch
        id="sandbox-toggle-switch"
        v-model="toggle"
        label="Toggle switch label"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import InputLabel from '../../src/components/common/InputLabel.vue'
import Tooltip from '../../src/components/common/TooltipPopover.vue'
import ToggleSwitch from '../../src/components/common/ToggleSwitch.vue'

const toggle = ref<boolean>(false)
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

  input {
    @include input-default;
  }
}
</style>
