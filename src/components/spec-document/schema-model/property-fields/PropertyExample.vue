<template>
  <p
    class="property-field-example"
    data-testid="property-field-example"
  >
    <span class="field-title">Example:</span>
    <span class="property-field-example-value">{{ stringifiedExample }}</span>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  example: {
    // allow any type since typeof example is unknown
    type: null,
    required: true,
  },
})

const stringifiedExample = computed(() => {
  let stringToRender = ''
  if (Array.isArray(props.example)) {
    // can't do a simple Array.toString because items of type Object are
    // converted to [Object Object], hence we need to stringify object items
    props.example.forEach((example, index) => {
      stringToRender +=
        typeof(example) === 'object' ? JSON.stringify(example) : example +
        `${index < props.example.length - 1 ? ',' : ''}`
    })
  } else if (typeof props.example === 'object') {
    stringToRender = JSON.stringify(props.example)
  }
  return stringToRender || props.example
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
