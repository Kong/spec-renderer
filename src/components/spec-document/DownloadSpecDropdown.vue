<template>
  <SelectDropdown
    :id="id"
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

defineProps({
  id: {
    type: String,
    default: 'download-format',
  },
})

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
.download-dropdown {
  :deep(.trigger-button) {
    background-color: var(--kui-color-background, $kui-color-background);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    color: var(--kui-color-text-primary, $kui-color-text-primary);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
  }
}
</style>
