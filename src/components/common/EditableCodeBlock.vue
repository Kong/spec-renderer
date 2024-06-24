<template>
  <div
    :class="{ 'error-wrapper': codeError }"
  >
    <code
      contenteditable="true"
      @input="handleInput"
    >
      {{ currentCode }}
    </code>
  </div>
</template>

<script setup lang="ts">
/* TODO: style it as a code block including higlighting */

import { ref, watch } from 'vue'


const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  lang: {
    type: String,
    default: '',
  },
})

const emit = defineEmits < {
  (e: 'request-body-changed', newBody: string): void
}>()

const handleInput = (e: Event) => {
  codeError.value = false
  const cText = (e.target as HTMLElement).innerText
  let resText = cText
  try {
    resText = JSON.stringify(JSON.parse(cText), null, 2)
  } catch (err) {
    codeError.value = true
  }
  currentCode.value = resText
  emit('request-body-changed', resText)
}


const currentCode = ref<string>()
const codeError = ref<boolean>(false)

watch(() => props.code, (newCode) => {
  currentCode.value = newCode
}, { immediate: true })

</script>

<style lang="scss" scoped>
code {
  width: 100%;
  min-height: 100px;
  background: transparent !important;
  outline: none;

}
.error-wrapper {
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-danger, $kui-color-border-danger);
}
</style>