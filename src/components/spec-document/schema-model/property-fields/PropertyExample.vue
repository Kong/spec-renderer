<template>
  <p
    class="property-field-example"
    data-testid="property-field-example"
  >
    <span class="field-title">Example:</span>
    <span class="property-field-example-value">{{ example }}</span>
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

<style lang="scss" scoped>
.property-field-example {
  @include model-property-additional-field;

  .property-field-example-value {
    @include model-property-field-value;
  }
}
</style>
