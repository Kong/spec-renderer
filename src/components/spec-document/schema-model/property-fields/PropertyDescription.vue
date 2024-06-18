<template>
  <p
    class="property-field-description"
    data-testid="property-field-description"
  >
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

<style lang="scss" scoped>
.property-field-description {
  color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
}
</style>
