<template>
  <MarkdownRenderer
    v-if="description"
    class="property-field-description"
    data-testid="property-field-description"
    :markdown="description"
  />
</template>

<script setup lang="ts">
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'

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
}
</style>
