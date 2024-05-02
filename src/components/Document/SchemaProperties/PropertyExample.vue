<template>
  <p v-if="example">
    <span>Example: </span> {{ example }}
  </p>
</template>

<script setup lang="ts">
defineProps({
  example: {
    // allow any type since typeof example is unknown
    type: null,
    default: '',
  },
})
</script>
