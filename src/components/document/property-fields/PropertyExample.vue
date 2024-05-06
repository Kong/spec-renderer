<template>
  <p data-testid="property-field-example">
    <span>Example:</span> {{ example }}
  </p>
</template>

<script setup lang="ts">
defineProps({
  example: {
    // allow any type since typeof example is unknown
    type: null,
    required: true,
  },
})
</script>
