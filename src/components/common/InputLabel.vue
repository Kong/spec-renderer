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

  margin-bottom: var(--kui-space-40, $kui-space-40) !important; // need important to override some margin overrides in some components
}
</style>
