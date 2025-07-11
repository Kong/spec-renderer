<template>
  <details
    class="endpoint-collapsible-section"
    :class="{ 'border-visible': borderVisible }"
    open
  >
    <summary
      class="endpoint-collapsible-section-header"
      @click="expanded = !expanded"
    >
      <slot name="title">
        <h3 v-if="title">
          {{ title }}
        </h3>
      </slot>
      <ChevronRightIcon
        class="chevron-icon"
        :class="{ 'expanded': expanded }"
        :size="16"
      />
    </summary>
    <div
      v-if="$slots.default"
      class="endpoint-collapsible-section-content"
    >
      <slot />
    </div>
  </details>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRightIcon } from '@kong/icons'

defineProps({
  borderVisible: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: '',
  },
})
const expanded = ref(true)
</script>

<style lang="scss" scoped>
.endpoint-collapsible-section {
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  line-height: var(--kui-line-height-30, $kui-line-height-30);

  .endpoint-collapsible-section-header {
    align-items: center;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    padding: var(--kui-space-40, $kui-space-40) var(--kui-space-0, $kui-space-0);

    // applies to the title slot and fallback title prop, both
    :slotted(h3) {
      font-size: var(--kui-font-size-40, $kui-font-size-40);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      line-height: var(--kui-line-height-40, $kui-line-height-40);
      margin: var(--kui-space-0, $kui-space-0);
    }

    .chevron-icon {
      @include toggle-icon;

      // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
      // stylelint-disable-next-line no-duplicate-selectors
      & {
        color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
      }
    }
  }

  .endpoint-collapsible-section-content {
    border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  }

  &:not(.border-visible) {
    >.endpoint-collapsible-section-header {
      padding-bottom: var(--kui-space-20, $kui-space-20);
    }

    >.endpoint-collapsible-section-content {
      border: none;
    }
  }
}
</style>
