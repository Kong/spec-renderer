<template>
  <p v-if="description">
    {{ description }}
  </p>
</template>

<script setup lang="ts">
defineProps({
  description: {
    type: String,
    default: '',
  },
})
</script>
