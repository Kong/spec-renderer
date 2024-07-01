<template>
  <button
    ref="copyButton"
    class="copy-button"
    :title="copied ? 'Copied!' : 'Copy'"
    @click.stop="copyCode"
  >
    <component
      :is="copied ? CheckIcon : CopyIcon"
      :color="copied ? 'green' : iconColor"
      :size="iconsSize"
    />
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CopyIcon, CheckIcon } from '@kong/icons'
import { useClipboard } from '@vueuse/core'

const props = defineProps({
  content:{
    required: true,
    type: String,
  },
  iconsSize: {
    type: String,
    default: '16px',
  },
  iconColor: {
    type: String,
    default: 'currentColor',
  },
})

const copyButton = ref<HTMLButtonElement>()
const { copy, copied } = useClipboard({ source: props.content, legacy: true })

async function copyCode(): Promise<void> {
  await copy(props.content)
}
</script>

<style lang="scss" scoped>
.copy-button {
  @include default-button-reset;
}
</style>
