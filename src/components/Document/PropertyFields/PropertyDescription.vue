<template>
  <p
    v-if="description"
    data-testid="property-field-description"
  >
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
