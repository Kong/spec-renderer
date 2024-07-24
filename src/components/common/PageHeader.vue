<template>
  <div
    class="spec-renderer-page-header"
    data-testid="spec-renderer-page-header"
  >
    <div class="page-header-title">
      <h1
        data-testid="spec-renderer-page-header-title"
      >
        {{ title }}
      </h1>
      <LabelBadge
        v-if="dataType"
        :label="dataType"
        type="neutral"
      />
    </div>
    <MarkdownRenderer
      v-if="description"
      class="page-header-description"
      data-testid="spec-renderer-page-header-description"
      :markdown="description"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import LabelBadge from './LabelBadge.vue'

import MarkdownRenderer from './MarkdownRenderer.vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  dataType: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss" scoped>
.spec-renderer-page-header {
  .page-header-title {
    align-items: center;
    display: flex;
    gap: var(--kui-space-50, $kui-space-50);
    h1 {
      font-size: var(--kui-font-size-80, $kui-font-size-80);
      font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
      line-height: var(--kui-line-height-70, $kui-line-height-70);
    }
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
