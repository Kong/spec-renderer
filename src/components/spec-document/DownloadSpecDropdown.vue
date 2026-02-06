<template>
  <div class="download-wrapper">
    <button
      class="download-spec-btn"
      data-testid="download-spec-btn"
      @click="downloadWithFormat"
    >
      Download
    </button>
    <SelectDropdown
      :id="id"
      class="download-dropdown"
      data-testid="download-format-dropdown"
      :items="downloadFormatItems"
      placement="bottom-end"
      trigger-button=""
    >
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

const selectedFormat = ref<'json' | 'yaml'>('json')

const downloadFormatItems: SelectItem[] = [
  { label: 'JSON', value: 'json', key: 'json' },
  { label: 'YAML', value: 'yaml', key: 'yaml' },
]

const selectFormat = (item: SelectItem) => {
  selectedFormat.value = item.value as 'json' | 'yaml'
  downloadWithFormat()
}

const downloadWithFormat = () => {
  downloadSpecFile(selectedFormat.value)
}
</script>

<style lang="scss" scoped>
.download-wrapper {
  display: flex;

  .download-spec-btn {
    @include default-button-reset;
    background-color: var(--kui-color-background, $kui-color-background);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-bottom-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    border-right-width: var(--kui-border-width-0, $kui-border-width-0);
    border-top-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    color: var(--kui-color-text-primary, $kui-color-text-primary);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);

    &:hover {
      background-color: var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest);
    }
  }

  .download-dropdown {
    display: flex;

    :deep(.trigger-button) {
      border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      border-bottom-right-radius: var(--kui-border-radius-30, $kui-border-radius-30);
      border-left-width: var(--kui-border-width-0, $kui-border-width-0);
      border-top-right-radius: var(--kui-border-radius-30, $kui-border-radius-30);
      height: 100%;
      padding: var(--kui-space-20, $kui-space-20) var(--kui-space-30, $kui-space-30);
    }
  }
}
</style>
