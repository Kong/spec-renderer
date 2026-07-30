<template>
  <img
    alt="response image"
    :src="url"
    width="300px"
  >
</template>

<script setup lang="ts">
import { useObjectUrl } from '@vueuse/core'

const { blob } = defineProps<{
  blob?: Blob
}>()

const url = useObjectUrl(() => blob)
</script>
