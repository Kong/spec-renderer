<template>
  <div
    class="spec-renderer-page-header"
    data-testid="spec-renderer-page-header"
  >
    <h1
      class="page-header-title"
      data-testid="spec-renderer-page-header-title"
    >
      {{ title }}
    </h1>
    <!-- eslint-disable vue/no-v-html -->
    <p
      v-if="renderedDescription"
      class="page-header-description"
      data-testid="spec-renderer-page-header-description"
      v-html="renderedDescription"
    />
    <!-- eslint-enable vue/no-v-html -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import useMarkdown from '@/composables/useMarkdown'
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})

const { mdRender } = useMarkdown()
const renderedDescription = computed(() =>
  props.description
    ? mdRender(props.description)
    : '',
)
</script>

<style lang="scss" scoped>
.spec-renderer-page-header {
  .page-header-title {
    font-size: var(--kui-font-size-80, $kui-font-size-80);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    line-height: var(--kui-line-height-70, $kui-line-height-70);
  }
  .page-header-description {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
  }

  > :not(:first-child) {
    margin-top: var(--kui-space-60, $kui-space-60);
  }
}
</style>
