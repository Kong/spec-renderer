<template>
  <p
    class="property-field-enum"
    data-testid="property-field-enum"
  >
    <span class="field-title">Allowed values:</span>
    <span class="enum-field-list">
      <span
        v-for="value in enumValueList"
        :key="value?.toString()"
        class="property-field-enum-value"
      >
        {{ value }}
      </span>
    </span>
  </p>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'

defineProps({
  enumValueList: {
    type: Array as PropType<SchemaObject['enum']>,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/mixins';

.property-field-enum {
  @include model-property-additional-field;

  .enum-field-list {
    display: inline-flex;
    flex-wrap: wrap;
    gap: var(--kui-space-20, $kui-space-20);

    .property-field-enum-value {
      @include model-property-field-value;
    }
  }
}
</style>
