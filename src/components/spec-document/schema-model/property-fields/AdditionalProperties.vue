<template>
  <div
    class="property-field-additional-properties"
    data-testid="property-field-additional-properties"
  >
    <div
      v-if="additionalProperties === true"
      class="footprint"
    >
      * Additional properties are allowed.
    </div>
    <div
      v-if="additionalProperties === false"
      class="footprint"
    >
      * Additional properties are <b>NOT</b> allowed.
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  additionalProperties: {
    type: Boolean,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.property-field-additional-properties {
  .footprint {
    font-size: var(--kui-font-size-20, $kui-font-size-20);
  }
}
</style>
