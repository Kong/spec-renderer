<template>
  <p data-testid="property-field-description">
    {{ description }}
  </p>
</template>

<script setup lang="ts">
defineProps({
  description: {
    type: String,
    required: true,
  },
})
</script>
