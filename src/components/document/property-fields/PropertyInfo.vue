<template>
  <div
    class="property-info"
    data-testid="property-field-info"
  >
    <code data-testid="property-field-title">{{ title }}</code>
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
    </span>
    <span
      v-if="requiredFields?.includes(title)"
      class="required-property"
      data-testid="property-field-required"
    >
      required
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
  &> :not(:first-child) {
    margin-left: var(--kui-space-40, $kui-space-40);
  }
  .property-type {
    color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
  }
  .required-property {
    color: var(--kui-color-text-danger, $kui-color-text-danger);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
  }
}
</style>
