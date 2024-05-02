<template>
  <p v-if="enumValue">
    Allowed values: {{ enumValue }}
  </p>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'

defineProps({
  enumValue: {
    type: Array as PropType<SchemaObject['enum']>,
    default: () => [],
  },
})
</script>
