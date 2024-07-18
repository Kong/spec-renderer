<template>
  <!-- eslint-disable vue/no-v-html -->
  <p
    class="property-field-description"
    data-testid="property-field-description"
    v-html="mdRender(description)"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<script setup lang="ts">
import useMarkdown from '@/composables/useMarkdown'

defineProps({
  description: {
    type: String,
    required: true,
  },
})

const { mdRender } = useMarkdown()
</script>

<style lang="scss" scoped>
.property-field-description {
  color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
}
</style>
