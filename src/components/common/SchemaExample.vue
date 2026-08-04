<template>
  <div
    class="schema-example"
  >
    <div class="schema-example-header">
      <slot>
        <span>{{ title }}</span>
        <div class="schema-example-header-actions">
          <SelectDropdown
            v-if="exampleSelectItems.length > 1"
            id="schema-example-select"
            :data-testid="exampleSelectTestId"
            :items="exampleSelectItems"
            :model-value="activeExample?.key"
            placement="bottom-end"
            @change="selectExample"
          />
          <CopyButton
            :content="activeSchemaExampleJson"
          />
        </div>
      </slot>
    </div>
    <CodeBlock
      :code="activeSchemaExampleJson"
      :is-resizable="isResizable"
      lang="json"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CodeBlock from '../common/CodeBlock.vue'
import CopyButton from '../common/CopyButton.vue'
import SelectDropdown from '../common/SelectDropdown.vue'
import { CODE_INDENT_SPACES } from '@/constants'
import type { SchemaExampleItem, SelectItem } from '@/types'

const {
  schemaExampleJson,
  title = 'Example',
  isResizable = false,
  examples = [],
  exampleSelectTestId = 'schema-example-selector',
} = defineProps<{
  schemaExampleJson: string
  title?: string
  isResizable?: boolean
  examples?: SchemaExampleItem[]
  exampleSelectTestId?: string
}>()

const activeExample = ref<SchemaExampleItem | undefined>(examples[0])

const exampleSelectItems = computed<SelectItem[]>(() => examples.map(example => ({
  key: example.key,
  label: example.label,
  value: example.key,
})))

const activeSchemaExampleJson = computed<string>(() => activeExample.value
  ? JSON.stringify(activeExample.value.value, null, CODE_INDENT_SPACES) ?? ''
  : schemaExampleJson,
)

const selectExample = (item: SelectItem): void => {
  activeExample.value = examples.find(example => example.key === item.value)
}
</script>

<style lang="scss" scoped>
.schema-example {
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  height: max-content;
  overflow: hidden;

  .schema-example-header {
    align-items: center;
    background: var(--kui-color-background, $kui-color-background);
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    color: var(--kui-color-text, $kui-color-text);
    display: flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    justify-content: space-between;
    line-height: var(--kui-line-height-40, $kui-line-height-40);
    padding: var(--kui-space-50, $kui-space-50);
  }

  .schema-example-header-actions {
    align-items: center;
    display: inline-flex;
    gap: var(--kui-space-50, $kui-space-50);

    :deep(.trigger-button) {
      @include small-bordered-trigger-button;
    }
  }
}
</style>
