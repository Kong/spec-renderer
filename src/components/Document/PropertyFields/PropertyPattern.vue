<template>
  <p
    v-if="pattern"
    data-testid="property-field-pattern"
  >
    Allowed pattern: <code>{{ pattern }}</code>
  </p>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'

defineProps({
  pattern: {
    type: String as PropType<SchemaObject['pattern']>,
    default: '',
  },
})
</script>
