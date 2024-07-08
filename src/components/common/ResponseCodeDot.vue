<template>
  <span
    class="response-code-dot"
    :class="[`response-code-${responseCode}`, size]"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { ResponseCode, ResponseCodeDotSize } from '@/types'
import { ResponseCodeDotVariants, ResponseCodeDotSizeVariants } from '@/types'

defineProps({
  responseCode: {
    type: String as PropType<ResponseCode>,
    required: true,
    validator: (value: ResponseCode) => {
      return ResponseCodeDotVariants.includes(value)
    },
  },
  /**
  * Size variations
  * One of ['small', 'large' ]
  */
  size: {
    type: String as PropType<ResponseCodeDotSize>,
    default: 'small',
    validator: (value: ResponseCodeDotSize): boolean => {
      return ResponseCodeDotSizeVariants.includes(value)
    },
  },
})
</script>

<style lang="scss" scoped>
.response-code-dot {
  display: inline-block;
  border-radius: var(--kui-border-radius-circle, $kui-border-radius-circle);
  flex-shrink: 0;

  // Code colors
  &.response-code-2xx {
    background-color: var(--kui-color-background-success-weak, $kui-color-background-success-weak);
  }

  &.response-code-4xx {
    background-color: var(--kui-color-background-warning-weak, $kui-color-background-warning-weak);
  }

  &.response-code-5xx {
    background-color: var(--kui-color-background-danger, $kui-color-background-danger);
  }

  // Size variations
  &.small {
    width: 8px;
    height: 8px;
  }

  &.large {
    width: 12px;
    height: 12px;
  }
}
</style>
