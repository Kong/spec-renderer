<template>
  <div class="response-type-select">
    <template
      v-for="component in componentList"
      :key="component.name"
    >
      <SelectDropdown
        v-if="component.optionList.length > 1"
        :items="component.optionList"
        :model-value="component.value"
        @change="(item) => handleSelectInputChange(item, component.name)"
      >
        <template #2xx-item-content="{ item }">
          <ResponseCodeDot
            v-if="item?.key"
            response-code="2xx"
          />
          {{ item?.label }}
        </template>
        <template #4xx-item-content="{ item }">
          <ResponseCodeDot
            v-if="item?.key"
            response-code="4xx"
          />
          {{ item?.label }}
        </template>
      </SelectDropdown>
      <span
        v-else
        class="response-type-select-label"
      >
        <ResponseCodeDot
          v-if="component.name === 'response-code-select-menu'"
          :response-code="component.value === '200' ? '2xx' : '4xx'"
        />
        {{ component.value }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import ResponseCodeDot from '@/components/common/ResponseCodeDot.vue'
import type { SelectComponentListItem, SelectItem } from '@/types'
import { ResponseSelectComponent } from '@/types'

defineProps({
  componentList: {
    type: Array as PropType<Array<SelectComponentListItem>>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'update-response-code', item: string): void
  (e: 'update-content-type', item: string): void
}>()

function handleSelectInputChange(item: SelectItem, componentName: ResponseSelectComponent) {
  if (componentName === ResponseSelectComponent.ResponseCodeSelectMenu) {
    emit('update-response-code',item.value)
  } else if (componentName === ResponseSelectComponent.ContentTypeSelectMenu) {
    emit('update-content-type',item.value)
  }
}
</script>

<style lang="scss" scoped>
.response-type-select {
  align-items: center;
  display: inline-flex;
  gap: var(--kui-space-40, $kui-space-40);

  :deep(.trigger-button) {
    @include small-bordered-trigger-button;
  }

  .response-type-select-label {
    // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
    // stylelint-disable-next-line no-duplicate-selectors
    & {
      @include small-bordered-trigger-button;
    }

    // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
    // stylelint-disable-next-line no-duplicate-selectors
    & {
      border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    }
  }
}
</style>
