<template>
  <p v-if="pattern">
    Allowed pattern: {{ pattern }}
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
