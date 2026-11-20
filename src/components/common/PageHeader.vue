<template>
  <div
    class="spec-renderer-page-header"
    data-testid="spec-renderer-page-header"
  >
    <div class="page-header-title">
      <h2
        v-if="title.trim()"
        data-testid="spec-renderer-page-header-title"
      >
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

      <div
        v-if="$slots.actions"
        class="page-header-actions"
      >
        <slot name="actions" />
      </div>
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
    // set on the title row rather than the h2, so that with no theme font the h2 still follows the host page's heading styles
    font-family: var(--kui-spec-renderer-page-header-title-font-family, var(--kui-spec-renderer-font-family-heading, inherit));
    gap: var(--kui-space-50, $kui-space-50);

    h2 {
      font-size: var(--kui-spec-renderer-page-header-title-font-size, var(--kui-font-size-80, $kui-font-size-80));
      font-weight: var(--kui-spec-renderer-page-header-title-font-weight, var(--kui-font-weight-bold, $kui-font-weight-bold));
      line-height: var(--kui-spec-renderer-page-header-title-line-height, var(--kui-line-height-70, $kui-line-height-70));
      overflow-wrap: anywhere;
    }

    .page-header-actions {
      margin-left: auto;
    }
  }

  > :not(:first-child) {
    margin-top: var(--kui-space-60, $kui-space-60);
  }
}
</style>
