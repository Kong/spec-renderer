<template>
  <button
    @click="startApiCall"
    class="tryit-btn">
    Try It!

  </button>
</template>

<style lang="scss" scoped>
.tryit-btn {
  border: $kui-border-width-10 solid $kui-color-border;
}
</style>

<script setup lang="ts">

const emit = defineEmits<{
  (e: 'tryit-api-call'): void,
}>()

const startApiCall = () => {
  emit('tryit-api-call')
}
</script>

