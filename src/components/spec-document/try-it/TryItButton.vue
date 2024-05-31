<template>
  <button
    class="tryit-btn"
    @click="startApiCall"
  >
    Try It!
  </button>
</template>

<script setup lang="ts">

const emit = defineEmits<{
  (e: 'tryit-api-call'): void,
}>()

const startApiCall = () => {
  emit('tryit-api-call')
}
</script>

<style lang="scss" scoped>
.tryit-btn {
  border: $kui-border-width-10 solid $kui-color-border;
}
</style>
