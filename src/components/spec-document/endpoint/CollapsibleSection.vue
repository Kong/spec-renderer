<template>
  <details
    class="endpoint-collapsible-section"
    :class="{ 'border-visible': borderVisible }"
    open
  >
    <summary
      class="endpoint-collapsible-section-header"
      @click="toggleState"
    >
      <slot name="title">
        <h3 v-if="title">
          {{ title }}
        </h3>
      </slot>
      <ChevronRightIcon
        class="chevron-icon"
        :class="{ 'expanded': expanded }"
        :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`"
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
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'

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

const expanded = ref<boolean>(true)

const toggleState = (e: Event) => {
  // Prevent toggling when clicking on dropdown triggers inside the header
  if (!(e.target as HTMLElement).dataset.selectDropdownTrigger) {
    expanded.value = !expanded.value
  }
}
</script>

<style lang="scss" scoped>
// A section is flat by default. A theme boxes it by setting a border width, and usually a header background, padding and gap.
.endpoint-collapsible-section {
  background-color: var(--kui-spec-renderer-section-color-background, var(--kui-color-background-transparent, $kui-color-background-transparent));
  border: var(--kui-spec-renderer-section-border-width, var(--kui-border-width-0, $kui-border-width-0)) solid var(--kui-spec-renderer-section-color-border, var(--kui-spec-renderer-color-border, var(--kui-color-border, $kui-color-border)));
  border-radius: var(--kui-spec-renderer-section-border-radius, var(--kui-spec-renderer-border-radius, var(--kui-border-radius-0, $kui-border-radius-0)));
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  // !important, like CollapsablePanel's margin, so that SpecDocument's `.reset-margin *` does not cancel the gap.
  // Named `-gap` like --kui-card-gap, which use-proper-token only accepts on margins when named `-space`.
  // stylelint-disable-next-line @kong/stylelint-plugin-design-tokens/use-proper-token
  margin-bottom: var(--kui-spec-renderer-section-gap, var(--kui-space-0, $kui-space-0)) !important;

  .endpoint-collapsible-section-header {
    align-items: center;
    background-color: var(--kui-spec-renderer-section-header-color-background, var(--kui-color-background-transparent, $kui-color-background-transparent));
    border-top-left-radius: var(--kui-spec-renderer-section-border-radius, var(--kui-spec-renderer-border-radius, var(--kui-border-radius-0, $kui-border-radius-0)));
    border-top-right-radius: var(--kui-spec-renderer-section-border-radius, var(--kui-spec-renderer-border-radius, var(--kui-border-radius-0, $kui-border-radius-0)));
    cursor: pointer;
    display: flex;
    // set on the header rather than the title, so that with no theme font the title still follows the host page's heading styles
    font-family: var(--kui-spec-renderer-section-title-font-family, var(--kui-spec-renderer-font-family-heading, inherit));
    justify-content: space-between;
    padding: var(--kui-space-40, $kui-space-40) var(--kui-spec-renderer-section-padding-x, var(--kui-space-0, $kui-space-0));

    // applies to the title slot and fallback title prop, both
    :slotted(h3) {
      color: var(--kui-spec-renderer-section-title-color-text, var(--kui-spec-renderer-color-text, var(--kui-color-text, $kui-color-text)));
      font-size: var(--kui-spec-renderer-section-title-font-size, var(--kui-font-size-40, $kui-font-size-40));
      font-weight: var(--kui-spec-renderer-section-title-font-weight, var(--kui-font-weight-semibold, $kui-font-weight-semibold));
      line-height: var(--kui-spec-renderer-section-title-line-height, var(--kui-line-height-40, $kui-line-height-40));
      margin: var(--kui-space-0, $kui-space-0);
    }

    .chevron-icon {
      // follows the section title color
      @include toggle-icon($textColor: var(--kui-spec-renderer-section-title-color-text, var(--kui-spec-renderer-color-text, var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong))));
    }
  }

  .endpoint-collapsible-section-content {
    border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-spec-renderer-section-color-border, var(--kui-spec-renderer-color-border, var(--kui-color-border, $kui-color-border)));
    padding: var(--kui-space-0, $kui-space-0) var(--kui-spec-renderer-section-padding-x, var(--kui-space-0, $kui-space-0));
  }

  // a collapsed section is only its header, so the header takes the bottom corners too
  &:not([open]) > .endpoint-collapsible-section-header {
    border-bottom-left-radius: var(--kui-spec-renderer-section-border-radius, var(--kui-spec-renderer-border-radius, var(--kui-border-radius-0, $kui-border-radius-0)));
    border-bottom-right-radius: var(--kui-spec-renderer-section-border-radius, var(--kui-spec-renderer-border-radius, var(--kui-border-radius-0, $kui-border-radius-0)));
  }

  &:not(.border-visible) {
    >.endpoint-collapsible-section-header {
      padding-bottom: var(--kui-space-20, $kui-space-20);
    }

    >.endpoint-collapsible-section-content {
      border: none;
    }
  }

  // A section nested in another one (the title of a body schema) is a box that groups the title with the fields it collapses.
  // Its subsection tokens fall back to the section box tokens, so boxing the sections boxes the nested ones too.
  .endpoint-collapsible-section {
    background-color: var(--kui-spec-renderer-subsection-color-background, var(--kui-spec-renderer-section-color-background, var(--kui-color-background-transparent, $kui-color-background-transparent)));
    border-radius: var(--kui-spec-renderer-subsection-border-radius, var(--kui-spec-renderer-section-border-radius, var(--kui-spec-renderer-border-radius, var(--kui-border-radius-0, $kui-border-radius-0))));
    border-width: var(--kui-spec-renderer-subsection-border-width, var(--kui-spec-renderer-section-border-width, var(--kui-border-width-0, $kui-border-width-0)));
    margin-bottom: var(--kui-space-0, $kui-space-0) !important;

    > .endpoint-collapsible-section-header {
      background-color: var(--kui-spec-renderer-subsection-header-color-background, var(--kui-spec-renderer-section-header-color-background, var(--kui-color-background-transparent, $kui-color-background-transparent)));
      border-top-left-radius: var(--kui-spec-renderer-subsection-border-radius, var(--kui-spec-renderer-section-border-radius, var(--kui-spec-renderer-border-radius, var(--kui-border-radius-0, $kui-border-radius-0))));
      border-top-right-radius: var(--kui-spec-renderer-subsection-border-radius, var(--kui-spec-renderer-section-border-radius, var(--kui-spec-renderer-border-radius, var(--kui-border-radius-0, $kui-border-radius-0))));
      padding: var(--kui-spec-renderer-subsection-header-padding, var(--kui-space-40, $kui-space-40) var(--kui-spec-renderer-section-padding-x, var(--kui-space-0, $kui-space-0)) var(--kui-space-20, $kui-space-20));
    }

    &:not([open]) > .endpoint-collapsible-section-header {
      border-bottom-left-radius: var(--kui-spec-renderer-subsection-border-radius, var(--kui-spec-renderer-section-border-radius, var(--kui-spec-renderer-border-radius, var(--kui-border-radius-0, $kui-border-radius-0))));
      border-bottom-right-radius: var(--kui-spec-renderer-subsection-border-radius, var(--kui-spec-renderer-section-border-radius, var(--kui-spec-renderer-border-radius, var(--kui-border-radius-0, $kui-border-radius-0))));
    }

    > .endpoint-collapsible-section-content {
      padding: var(--kui-spec-renderer-subsection-content-padding, var(--kui-space-0, $kui-space-0) var(--kui-spec-renderer-section-padding-x, var(--kui-space-0, $kui-space-0)));
    }
  }
}
</style>
