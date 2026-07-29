<template>
  <img
    alt="response image"
    :src="url"
    width="300px"
  >
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { useObjectUrl } from '@vueuse/core'

const props = defineProps({
  blob: {
    type: Object as PropType<Blob | undefined>,
    default: undefined,
  },
})

const url = useObjectUrl(() => props.blob)
</script>
