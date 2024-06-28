<template>
  <label :class="{ required }">
    <slot />
  </label>
</template>

<script setup lang="ts">
defineProps({
  required: {
    type: Boolean,
    default: false,
  },
})
</script>

<style lang="scss" scoped>
label {
  @include label-default;
}
</style>
