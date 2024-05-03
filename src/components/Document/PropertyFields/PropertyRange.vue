<template>
  <p
    v-if="max || min"
    data-testid="property-field-range"
  >
    <span v-if="max">Max: {{ max }}</span>
    <span v-if="max && min">|</span>
    <span v-if="min"> Min: {{ min }}</span>
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
