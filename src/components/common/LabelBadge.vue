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
   * One of ['neutral', 'primary' ]
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
.label-badge {
  @include badge-appearance;

  // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
  // stylelint-disable-next-line no-duplicate-selectors
  & {
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    display: inline-block;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
  }

  &.neutral {
    @include badge-appearance(
      $bgColor: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker),
      $textColor: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong)
    );
  }

  &.primary {
    @include badge-appearance(
      $bgColor: var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest),
      $textColor: var(--kui-color-text-primary, $kui-color-text-primary)
    );
  }


  /* Sizes */

  &.small {
    padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
  }

  &.large {
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
  }
}
</style>
