<template>
  <span
    class="label-badge"
    :class="[type, size]"
    data-testid="label-badge"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { BadgeSize, LabelBadgeType } from '@/types'
import { BadgeSizeVariants, LabelBadgeTypeVariants } from '@/types'

defineProps({
  label: {
    type: String,
    default: '',
  },
  /**
   * Type variations
   * One of ['neutral', 'primary', 'success', 'warning' ]
   */
  type: {
    type: String as PropType<LabelBadgeType>,
    required: true,
    validator: (value: LabelBadgeType): boolean => {
      return LabelBadgeTypeVariants.includes(value)
    },
  },
  /**
  * Size variations
  * One of ['small', 'large' ]
  */
  size: {
    type: String as PropType<BadgeSize>,
    default: 'large',
    validator: (value: BadgeSize): boolean => {
      return BadgeSizeVariants.includes(value)
    },
  },
})
</script>

<style lang="scss" scoped>
// Badge component tokens, like KBadge - the `primary` type maps to KBadge's `info` appearance
.label-badge {
  @include badge-appearance;

  // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
  // stylelint-disable-next-line no-duplicate-selectors
  & {
    border-radius: var(--kui-badge-border-radius, var(--kui-spec-renderer-border-radius-small, var(--kui-border-radius-20, $kui-border-radius-20)));
    display: inline-block;
    font-size: var(--kui-badge-font-size, var(--kui-font-size-20, $kui-font-size-20));
    font-weight: var(--kui-badge-font-weight, var(--kui-font-weight-semibold, $kui-font-weight-semibold));
    line-height: var(--kui-badge-line-height, var(--kui-line-height-20, $kui-line-height-20));
  }

  &.neutral {
    @include badge-appearance(
      $bgColor: var(--kui-badge-color-background-neutral, var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker)),
      $textColor: var(--kui-badge-color-text-neutral, var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong))
    );
  }

  &.primary {
    @include badge-appearance(
      $bgColor: var(--kui-badge-color-background-info, var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest)),
      $textColor: var(--kui-badge-color-text-info, var(--kui-color-text-primary, $kui-color-text-primary))
    );
  }

  &.success {
    @include badge-appearance(
      $bgColor: var(--kui-badge-color-background-success, var(--kui-color-background-success-weakest, $kui-color-background-success-weakest)),
      $textColor: var(--kui-badge-color-text-success, var(--kui-color-text-success, $kui-color-text-success))
    );
  }

  &.warning {
    @include badge-appearance(
      $bgColor: var(--kui-badge-color-background-warning, var(--kui-color-background-warning-weakest, $kui-color-background-warning-weakest)),
      $textColor: var(--kui-badge-color-text-warning, var(--kui-color-text-warning, $kui-color-text-warning))
    );
  }


  /* Sizes */

  &.small {
    padding: var(--kui-badge-padding-small, var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30));
  }

  &.large {
    padding: var(--kui-badge-padding-y, var(--kui-space-20, $kui-space-20)) var(--kui-badge-padding-x, var(--kui-space-40, $kui-space-40));
  }
}
</style>
