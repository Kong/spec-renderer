<template>
  <div
    class="spec-renderer-page-header"
    data-testid="spec-renderer-page-header"
  >
    <div class="page-header-title">
      <h2 data-testid="spec-renderer-page-header-title">
        {{ title }}
      </h2>
      <LabelBadge
        v-if="type"
        data-testid="data-type-badge"
        :label="type"
        type="neutral"
      />
      <LabelBadge
        v-if="deprecated"
        data-testid="deprecated-badge"
        label="DEPRECATED"
        type="neutral"
      />
    </div>
    <MarkdownRenderer
      v-if="description"
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
  type: {
    type: String,
    default: '',
  },
  deprecated: {
    type: Boolean,
    default: false,
  },
})
</script>

<style lang="scss" scoped>
.spec-renderer-page-header {
  .page-header-title {
    align-items: center;
    display: flex;
    gap: var(--kui-space-50, $kui-space-50);

    h2 {
      font-size: var(--kui-font-size-80, $kui-font-size-80);
      font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
      line-height: var(--kui-line-height-70, $kui-line-height-70);
    }
  }

  > :not(:first-child) {
    margin-top: var(--kui-space-60, $kui-space-60);
  }
}
</style>
