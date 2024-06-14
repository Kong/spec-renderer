<template>
  <p
    class="property-field-pattern"
    data-testid="property-field-pattern"
  >
    <span class="field-title">Match pattern:</span>
    <span class="property-field-pattern-value">{{ pattern }}</span>
  </p>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'

defineProps({
  pattern: {
    type: String as PropType<SchemaObject['pattern']>,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.property-field-pattern {
  @include model-property-additional-field;

  .property-field-pattern-value {
    @include model-property-field-value;
  }
}
</style>
