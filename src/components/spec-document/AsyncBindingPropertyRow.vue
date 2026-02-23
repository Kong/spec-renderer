<template>
  <details
    v-if="isObject"
    class="binding-property-row--expandable"
    :data-testid="`binding-expandable-${propKey}`"
  >
    <summary class="binding-property-row">
      <span class="binding-key binding-key--parent">{{ propKey }}</span>
      <ChevronRightIcon
        class="binding-chevron"
        :size="KUI_ICON_SIZE_30"
      />
    </summary>
    <div class="binding-nested-rows">
      <AsyncBindingPropertyRow
        v-for="(childVal, childKey) in value"
        :key="String(childKey)"
        :prop-key="String(childKey)"
        :value="childVal"
      />
    </div>
  </details>

  <div
    v-else
    class="binding-property-row"
    :data-testid="`binding-row-${propKey}`"
  >
    <span class="binding-key">{{ propKey }}</span>
    <span class="binding-value">{{ displayValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRightIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import AsyncBindingPropertyRow from './AsyncBindingPropertyRow.vue'

const props = defineProps<{
  propKey: string
  value: unknown
}>()

const isObject = computed(
  () => typeof props.value === 'object' && props.value !== null && !Array.isArray(props.value),
)

const displayValue = computed(() =>
  Array.isArray(props.value) ? (props.value as unknown[]).join(', ') : props.value,
)
</script>

<style lang="scss" scoped>
.binding-property-row {
  align-items: center;
  display: flex;
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  gap: var(--kui-space-40, $kui-space-40);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  padding: var(--kui-space-30, $kui-space-30) var(--kui-space-0, $kui-space-0);

  .binding-key {
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    flex-shrink: 0;

    &--parent {
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    }
  }

  .binding-value {
    color: var(--kui-color-text, $kui-color-text);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  .binding-chevron {
    color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
    flex-shrink: 0;
    height: var(--kui-icon-size-30, $kui-icon-size-30);
    transition: transform 0.2s ease;
    width: var(--kui-icon-size-30, $kui-icon-size-30);
  }
}

.binding-property-row--expandable {
  &[open] > .binding-property-row .binding-chevron {
    transform: rotate(90deg);
  }

  > .binding-property-row {
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }
  }

  .binding-nested-rows {
    border-left: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    margin-left: 4px;
    padding-left: var(--kui-space-50, $kui-space-50);
  }
}
</style>
