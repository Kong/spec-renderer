<template>
  <p
    class="property-field-default"
    data-testid="property-field-default"
  >
    <span class="field-title">Default:</span>
    <span class="property-field-default-value">
      {{ stringifyUnknownValue(defaultValue) }}
    </span>
  </p>
</template>

<script setup lang="ts">
import { stringifyUnknownValue } from '@/utils'

defineProps({
  defaultValue: {
    // allow any type since typeof default value is unknown
    type: null,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.property-field-default {
  @include model-property-additional-field;

  .property-field-default-value {
    @include model-property-field-value;
  }
}
</style>
