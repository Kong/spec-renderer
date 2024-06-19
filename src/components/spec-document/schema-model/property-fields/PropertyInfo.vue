<template>
  <div
    class="property-info"
    data-testid="property-field-info"
  >
    <span
      class="property-title"
      data-testid="property-field-title"
    >
      {{ title }}
    </span>
    <span class="property-type">
      <span
        v-if="propertyType"
        data-testid="property-field-type"
      >
        {{ propertyType }}
      </span>
      <span
        v-if="propertyItemType"
        data-testid="property-field-item-type"
      >
        {{ `[${propertyItemType}]` }}
      </span>
      <span
        v-if="format"
        data-testid="property-field-format"
      >
        {{ `(${format})` }}
      </span>
      <span
        v-if="requiredFields?.includes(title)"
        class="required-property"
        data-testid="property-field-required"
      >required</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { SchemaObject } from '@/types'
import type { PropType } from 'vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  propertyType: {
    type: [Array, String] as PropType<SchemaObject['type']>,
    default: '',
  },
  format: {
    type: String as PropType<SchemaObject['format']>,
    default: '',
  },
  propertyItemType: {
    type: [Array, String] as PropType<SchemaObject['type']>,
    default: '',
  },
  requiredFields: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
})
</script>

<style lang="scss" scoped>
.property-info {
  font-family: var(--kui-font-family-code, $kui-font-family-code);

  .property-title {
    color: var(--kui-color-text-primary, $kui-color-text-primary);
    font-size:var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    margin-right: var(--kui-space-50, $kui-space-50);
  }

  .property-type {
    color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    line-height: var(--kui-line-height-20, $kui-line-height-20);

    > :not(:first-child) {
      margin-left: var(--kui-space-40, $kui-space-40);
    }

    .required-property {
      color: var(--kui-color-text-danger, $kui-color-text-danger);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
    }
  }
}
</style>
