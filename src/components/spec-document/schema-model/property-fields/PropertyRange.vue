<template>
  <p
    class="property-field-range"
    data-testid="property-field-range"
  >
    <span
      v-if="Number.isFinite(max)"
      class="property-field-range-value"
    >&gt;&equals; {{ max }}</span>
    <span
      v-if="Number.isFinite(min)"
      class="property-field-range-value"
    >&lt;&equals; {{ min }}</span>
  </p>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'

defineProps({
  max: {
    type: Number as PropType<SchemaObject['maximum']>,
    default: null,
  },
  min: {
    type: Number as PropType<SchemaObject['minimum']>,
    default: null,
  },
})
</script>

<style lang="scss" scoped>
.property-field-range {
  @include model-property-additional-field;

  > :first-child {
    margin-right: var(--kui-space-40, $kui-space-40);
  }

  .property-field-range-value {
    @include model-property-field-value;
  }
}
</style>
