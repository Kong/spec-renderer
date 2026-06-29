<template>
  <button
    class="mask-toggle-button"
    :title="modelValue ? 'Show sensitive data' : 'Mask sensitive data'"
    type="button"
    @click.stop="modelValue = !modelValue"
  >
    <component
      :is="modelValue ? VisibilityOffIcon : VisibilityIcon"
      :size="KUI_ICON_SIZE_30"
    />
  </button>
</template>

<script setup lang="ts">
import { VisibilityIcon, VisibilityOffIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'

const modelValue = defineModel<boolean>({ required: true })
</script>

<style lang="scss" scoped>
.mask-toggle-button {
  @include default-button-reset;
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);

  &:hover {
    color: var(--kui-color-text, $kui-color-text);
  }
}
</style>
