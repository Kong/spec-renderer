<template>
  <SelectDropdown
    class="download-dropdown"
    data-testid="download-format-dropdown"
    :items="downloadFormatItems"
    placement="bottom-end"
  >
    <template #trigger-content>
      <span>Download</span>
    </template>
    <template #json-item="{ item }">
      <button
        data-testid="download-json-btn"
        @click="selectFormat(item)"
      >
        {{ item.label }}
      </button>
    </template>
    <template #yaml-item="{ item }">
      <button
        data-testid="download-yaml-btn"
        @click="selectFormat(item)"
      >
        {{ item.label }}
      </button>
    </template>
  </SelectDropdown>
</template>

<script setup lang="ts">
import SelectDropdown from '../common/SelectDropdown.vue'
import composables from '@/composables'
import type { SelectItem } from '@/types'

const { downloadSpecFile } = composables.useSchemaParser()

const downloadFormatItems: SelectItem[] = [
  { label: 'JSON', value: 'json', key: 'json' },
  { label: 'YAML', value: 'yaml', key: 'yaml' },
]

const selectFormat = (item: SelectItem) => {
  downloadSpecFile(item.value as 'json' | 'yaml')
}
</script>

<style lang="scss" scoped>
// the Download button is a secondary button, like KButton's secondary appearance
.download-dropdown {
  :deep(.trigger-button) {
    background-color: var(--kui-button-color-background-secondary, var(--kui-color-background, $kui-color-background));
    border: var(--kui-button-border-width-medium, var(--kui-border-width-10, $kui-border-width-10)) solid var(--kui-button-color-border-secondary, var(--kui-color-border, $kui-color-border));
    border-radius: var(--kui-button-border-radius-medium, var(--kui-border-radius-30, $kui-border-radius-30));
    color: var(--kui-button-color-text-secondary, var(--kui-color-text-primary, $kui-color-text-primary));
    font-size: var(--kui-button-font-size-medium, var(--kui-font-size-30, $kui-font-size-30));
    font-weight: var(--kui-button-font-weight, var(--kui-font-weight-semibold, $kui-font-weight-semibold));
    line-height: var(--kui-button-line-height-medium, var(--kui-line-height-30, $kui-line-height-30));
    padding: var(--kui-button-padding-y-medium, var(--kui-space-20, $kui-space-20)) var(--kui-button-padding-x-medium, var(--kui-space-40, $kui-space-40));

    &:hover:not(:disabled):not(:focus):not(:active) {
      background-color: var(--kui-button-color-background-secondary-hover, var(--kui-color-background, $kui-color-background));
      border-color: var(--kui-button-color-border-secondary-hover, var(--kui-color-border-primary-strong, $kui-color-border-primary-strong));
      color: var(--kui-button-color-text-secondary-hover, var(--kui-color-text-primary-strong, $kui-color-text-primary-strong));
    }

    // there is no focus color token - focus-visible follows the hover state
    &:focus-visible {
      background-color: var(--kui-button-color-background-secondary-hover, var(--kui-color-background, $kui-color-background));
      border-color: var(--kui-button-color-border-secondary-hover, var(--kui-color-border-primary-stronger, $kui-color-border-primary-stronger));
      color: var(--kui-button-color-text-secondary-hover, var(--kui-color-text-primary-stronger, $kui-color-text-primary-stronger));
    }

    &:active {
      background-color: var(--kui-button-color-background-secondary-active, var(--kui-color-background, $kui-color-background));
      border-color: var(--kui-button-color-border-secondary-active, var(--kui-color-border-primary-strongest, $kui-color-border-primary-strongest));
      color: var(--kui-button-color-text-secondary-active, var(--kui-color-text-primary-strongest, $kui-color-text-primary-strongest));
    }
  }
}
</style>
