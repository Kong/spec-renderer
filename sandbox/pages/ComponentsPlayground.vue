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
      <h2>Dropdown</h2>
      <SelectDropdown
        id="sandbox-select-dropdown"
        :items="dropdownItems"
      >
        <template #item-2-item-content>
          <KongIcon />
          Item 2
        </template>

        <template #item-3-item>
          <a
            href="http://localhost:5173/spec-renderer/comppnents"
            target="_blank"
          >
            Item 3 (link)
          </a>
        </template>

        <template #item-4-item>
          <button @click="onDropdownButtonClick">
            Item 4 (action button)
          </button>
        </template>
      </SelectDropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import InputLabel from '../../src/components/common/InputLabel.vue'
import Tooltip from '../../src/components/common/TooltipPopover.vue'
import SelectDropdown from '../../src/components/common/SelectDropdown.vue'
import { KongIcon } from '@kong/icons'

const dropdownItems = [
  { label: 'Item 1', value: 'item-1' },
  { label: 'Item 2', value: 'item-2', key: 'item-2' },
  { label: 'Item 3', value: 'item-3', key: 'item-3' },
  { label: 'Item 4', value: 'item-4', key: 'item-4' },
]

const onDropdownButtonClick = () => {
  alert('Item 4 clicked')
}
</script>

<style lang="scss" scoped>
.wrapper {
  gap: 12px;

  .component-container {
    padding: 12px;
    border-radius: 4px;
    border: 1px solid lightgray;
    margin-bottom: 12px;
  }

  input {
    @include input-default;
  }
}
</style>
