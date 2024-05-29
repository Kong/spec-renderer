<template>
  <span
    class="node-item-badge"
    :class="[method, size]"
  >
    {{ method }}
  </span>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

/**
 * This is more of a helper type to help keep track of the methods we define styles for (a method that doesn't match any of these will just use the default styling).
 * Because method comes from the spec, it can be any string.
 */
type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace'
type BadgeSize = 'small' | 'large'

defineProps({
  method: {
    type: String as PropType<Method | String>,
    default: '',
  },
  /**
  * Size variations
  * One of ['small', 'large' ]
  */
  size: {
    type: String as PropType<BadgeSize>,
    default: 'small',
    validator: (value: string): boolean => {
      return ['small', 'large'].includes(value)
    },
  },
})
</script>

<style lang="scss" scoped>
@mixin badge-appearance(
  $bgColor: var(--kui-color-background-neutral-weak, $kui-color-background-neutral-weak),
  $textColor: var(--kui-color-text, $kui-color-text)
) {
  background-color: $bgColor;
  color: $textColor;
}

.node-item-badge {
  @include badge-appearance;

  border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  letter-spacing: var(--kui-letter-spacing-minus-30, $kui-letter-spacing-minus-30);
  line-height: var(--kui-line-height-20, $kui-line-height-20);
  text-transform: uppercase;

  &.get {
    @include badge-appearance(var(--kui-method-color-background-get, $kui-method-color-background-get),
      var(--kui-method-color-text-get, $kui-method-color-text-get));
  }

  &.post {
    @include badge-appearance(var(--kui-method-color-background-post, $kui-method-color-background-post),
      var(--kui-method-color-text-post, $kui-method-color-text-post));
  }

  &.put {
    @include badge-appearance(var(--kui-method-color-background-put, $kui-method-color-background-put),
      var(--kui-method-color-text-put, $kui-method-color-text-put));
  }

  &.delete {
    @include badge-appearance(var(--kui-method-color-background-delete, $kui-method-color-background-delete),
      var(--kui-method-color-text-delete, $kui-method-color-text-delete));
  }

  &.patch {
    @include badge-appearance(var(--kui-method-color-background-patch, $kui-method-color-background-patch),
      var(--kui-method-color-text-patch, $kui-method-color-text-patch));
  }

  &.options {
    @include badge-appearance(var(--kui-method-color-background-options, $kui-method-color-background-options),
      var(--kui-method-color-text-options, $kui-method-color-text-options));
  }

  &.head {
    @include badge-appearance(var(--kui-method-color-background-head, $kui-method-color-background-head),
      var(--kui-method-color-text-head, $kui-method-color-text-head));
  }

  &.connect {
    @include badge-appearance(var(--kui-method-color-background-connect, $kui-method-color-background-connect),
      var(--kui-method-color-text-connect, $kui-method-color-text-connect));
  }

  &.trace {
    @include badge-appearance(var(--kui-method-color-background-trace, $kui-method-color-background-trace),
      var(--kui-method-color-text-trace, $kui-method-color-text-trace));
  }

  /* Sizes */
  &.small {
    font-size: var(--kui-font-size-10, $kui-font-size-10);
    padding: var(--kui-space-0, $kui-space-0) var(--kui-space-30, $kui-space-30);
  }
  &.large {
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
  }
}
</style>
