<template>
  <button
    :aria-label="modelValue ? `Hide ${label}` : `Show ${label}`"
    class="visibility-toggle-button"
    :title="modelValue ? `Hide ${label}` : `Show ${label}`"
    type="button"
    @click.stop="modelValue = !modelValue"
  >
    <!-- eslint-disable @kong/eslint-plugin-design-tokens/token-constant-requires-css-var -->
    <component
      :is="modelValue ? VisibilityIcon : VisibilityOffIcon"
      :size="KUI_ICON_SIZE_30"
    />
  </button>
</template>

<script setup lang="ts">
import { VisibilityIcon, VisibilityOffIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'

withDefaults(defineProps<{
  label?: string
}>(), {
  label: 'sensitive data',
})

const modelValue = defineModel<boolean>({ default: false })
</script>

<style lang="scss" scoped>
.visibility-toggle-button {
  @include default-button-reset;
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);

  &:hover {
    color: var(--kui-color-text, $kui-color-text);
  }
}
</style>
