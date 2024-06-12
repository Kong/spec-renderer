<template>
  <button
    ref="copyButton"
    class="copy-button"
    @click="copyCode"
  >
    <CopyIcon
      :color="iconColor"
      :size="iconsSize"
    />
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CopyIcon } from '@kong/icons'
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

async function copyCode(): Promise<void> {
  // todo: show a message if copied successfully
  const { copy } = useClipboard({ source: props.content, legacy: true })
  await copy(props.content)
}
</script>

<style lang="scss" scoped>
.copy-button {
  @include default-button-reset;
}
</style>
