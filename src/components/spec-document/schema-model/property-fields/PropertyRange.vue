<template>
  <p
    class="property-field-range"
    data-testid="property-field-range"
  >
    <span
      v-for="(rangeItem) in rangeItemList"
      :key="rangeItem.key"
      class="property-field-range-value"
    >
      {{ rangeItem.value }}
    </span>
  </p>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { SchemaObject } from '@/types'

const props = defineProps({
  max: {
    type: Number as PropType<SchemaObject['maximum']>,
    default: null,
  },
  min: {
    type: Number as PropType<SchemaObject['minimum']>,
    default: null,
  },
  maxLength: {
    type: Number as PropType<SchemaObject['maxLength']>,
    default: null,
  },
  minLength: {
    type: Number as PropType<SchemaObject['minLength']>,
    default: null,
  },
  exclusiveMaximum: {
    type: [Boolean, Number],
    default: null,
  },
  exclusiveMinimum: {
    type: [Boolean, Number],
    default: null,
  },
  multipleOf: {
    type: Number as PropType<SchemaObject['multipleOf']>,
    default: null,
  },
  maxItems: {
    type: Number as PropType<SchemaObject['maxItems']>,
    default: null,
  },
  minItems: {
    type: Number as PropType<SchemaObject['minItems']>,
    default: null,
  },
})

const rangeItemList = computed(() => {
  const rangeList = []

  /**
   * in OAS 2.0 and before, exclusiveMinimum and exclusiveMaximum are boolean values that affect max and min.
   * In OAS 3.1, they are number values.
   */
  if (Number.isFinite(props.min)) {
    rangeList.push({
      key: 'range-min',
      value:
      typeof props.exclusiveMinimum === 'boolean' && props.exclusiveMinimum
        ? `> ${props.min}`
        : `>= ${props.min}`,
    })
  }
  if (Number.isFinite(props.max)) {
    rangeList.push({
      key: 'range-max',
      value:
      typeof props.exclusiveMaximum === 'boolean' && props.exclusiveMaximum
        ? `< ${props.max}`
        : `<= ${props.max}`,
    })
  }
  if (Number.isFinite(props.minLength)) {
    rangeList.push({
      key: 'range-min-length',
      value: `>= ${props.minLength} characters`,
    })
  }
  if (Number.isFinite(props.maxLength)) {
    rangeList.push({
      key: 'range-max-length',
      value: `<= ${props.maxLength} characters`,
    })
  }
  if (Number.isFinite(props.exclusiveMinimum)) {
    rangeList.push({
      key: 'range-exclusive-min',
      value: `> ${props.exclusiveMinimum}`,
    })
  }
  if (Number.isFinite(props.exclusiveMaximum)) {
    rangeList.push({
      key: 'range-exclusive-max',
      value: `< ${props.exclusiveMaximum}`,
    })
  }
  if (Number.isFinite(props.multipleOf)) {
    rangeList.push({ key: 'range-multiple-of', value: `x ${props.multipleOf}` })
  }
  if (Number.isFinite(props.minItems)) {
    rangeList.push({ key: 'range-min-items', value: `>= ${props.minItems} items` })
  }
  if (Number.isFinite(props.maxItems)) {
    rangeList.push({ key: 'range-max-items', value: `<= ${props.maxItems} items` })
  }

  return rangeList
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
