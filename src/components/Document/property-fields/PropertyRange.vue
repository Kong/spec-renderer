<template>
  <p data-testid="property-field-range">
    <span v-if="Number.isFinite(max)">Max: {{ max }}</span>
    <span v-if="Number.isFinite(max) && Number.isFinite(min)"> | </span>
    <span v-if="Number.isFinite(min)">Min: {{ min }}</span>
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
