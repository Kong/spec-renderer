<template>
  <Popover
    class="tooltip-popover"
    max-width="300px"
    open-on-mouseover
    :placement="placement"
    role="tooltip"
  >
    <slot>
      <InfoIcon
        class="tooltip-trigger-info-icon"
        :color="`var(--kui-color-text-neutral, ${KUI_COLOR_TEXT_NEUTRAL})`"
        tabindex="0"
      />
    </slot>

    <template #content>
      <slot name="content">
        {{ text }}
      </slot>
    </template>
  </Popover>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import Popover from './HeadlessPopover.vue'
import { InfoIcon } from '@kong/icons'
import type { Placement } from '@floating-ui/vue'
import { PopoverPlacementVariants } from '@/types'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'

defineProps({
  text: {
    type: String,
    default: 'Tooltip content',
  },
  placement: {
    type: String as PropType<Placement>,
    validator: (value: Placement): boolean => PopoverPlacementVariants.includes(value),
    default: 'top-start',
  },
})
</script>

<style lang="scss" scoped>
.tooltip-popover {
  .tooltip-trigger-info-icon {
    height: var(--kui-icon-size-40, $kui-icon-size-40) !important;
    width: var(--kui-icon-size-40, $kui-icon-size-40) !important;
  }

  :deep(.popover-content) {
    background-color: var(--kui-color-background-inverse, $kui-color-background-inverse);
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    color: var(--kui-color-text-inverse, $kui-color-text-inverse);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    padding: var(--kui-space-20, $kui-space-20);
  }
}
</style>
