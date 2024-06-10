<template>
  <div
    class="version-badge"
    :class="type"
  >
    <slot>{{ version }}</slot>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { VersionBadgeType } from '@/types'
import { VersionBadgeTypeVariants } from '@/types'

defineProps({
  version: {
    type: String,
    default: '',
  },
  type: {
    type: String as PropType<VersionBadgeType>,
    required: true,
    validator: (value: VersionBadgeType): boolean => {
      return VersionBadgeTypeVariants.includes(value)
    },
  },
})
</script>

<style lang="scss" scoped>
.version-badge {
  @include badge-appearance;
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  display: inline-block;
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  line-height: var(--kui-line-height-20, $kui-line-height-20);
  padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);

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
}
</style>
