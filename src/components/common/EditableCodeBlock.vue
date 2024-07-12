<template>
  <div :class="{ 'editable-code-wrapper': true, 'error-wrapper': codeError }">
    <CodeBlock
      :code="presentedCode || ''"
      :lang="lang"
    />
    <code
      v-once
      ref="editableInput"
      class="editable-code"
      contenteditable="true"
      spellcheck="false"
      @focusout="handleFocusOut"
      @input="handleInput"
    >{{ editableCode }}</code>
  </div>
</template>

<script setup lang="ts">
/* TODO: style it as a code block including higlighting */

import { ref, watch } from 'vue'
import CodeBlock from './CodeBlock.vue'

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

const editableInput = ref<HTMLDivElement | null>(null)

const editableCode = ref<string>()
const presentedCode = ref<string>()

const codeError = ref<boolean>(false)
const cursorPosition = ref<number>(0)


const setCursorPosition = (customPosition: number, eol: boolean) => {
  if (typeof window === 'undefined' || !editableInput.value || !editableInput.value.childNodes[0]) {
    return
  }
  // select text from a window
  const selection = window.getSelection()

  // create a range
  const selectedRange = document.createRange()
  let rangeNode = 0
  let rangePos = customPosition
  for (let i = 0; editableInput.value.childNodes.length; i++) {
    const contentLen = (editableInput.value.childNodes[i].textContent || '').length
    if (rangePos - contentLen < 0) {
      break
    }
    rangeNode++
    rangePos -= contentLen
  }

  if (eol) {
    rangePos = editableInput.value.childNodes[rangeNode].textContent?.length || 0
  }

  selectedRange.setStart(editableInput.value.childNodes[rangeNode], rangePos)
  // collapse the range at boundaries
  selectedRange.collapse(true)

  // remove all ranges
  selection?.removeAllRanges()

  // add a new range to the selected text
  selection?.addRange(selectedRange)

  // focus the cursor
  editableInput.value.focus()
}

const getCursorPosition = () => {

  if (typeof window === 'undefined' || !editableInput.value) {
    return 0
  }
  const selection = window.getSelection()
  if (!selection) {
    return 0
  }
  const range = selection.rangeCount > 0 ? selection?.getRangeAt(0) : null
  if (range) {
    const clonedRange = range?.cloneRange()
    clonedRange?.selectNodeContents(editableInput.value)
    clonedRange?.setEnd(range.endContainer, range?.endOffset)
    return clonedRange.toString().length
  }
  return 0
}

const handleInput = (e: Event) => {
  const cText = (e.target as HTMLElement).innerText

  if ((e as InputEvent).inputType === 'insertParagraph') {
    presentedCode.value = cText
    return
  }

  codeError.value = false
  let resText = formatCode(cText, props.lang)
  presentedCode.value = resText
  cursorPosition.value = getCursorPosition()
  emit('request-body-changed', resText)
}

const handleFocusOut = (e: Event) => {
  codeError.value = false
  const cText = (e.target as HTMLElement).innerText
  let resText = formatCode(cText, props.lang)
  editableCode.value = resText
  presentedCode.value = resText
  emit('request-body-changed', resText)
}

const formatCode = (codeToFormat: string, codeLang: string): string => {
  let formattedCode = codeToFormat
  codeError.value = false
  if (codeLang === 'json') {
    try {
      formattedCode = JSON.stringify(JSON.parse(codeToFormat), null, 2)
    } catch (err) {
      codeError.value = true
    }
  }
  return formattedCode
}

watch(() => ({ code: props.code, lang: props.lang }), ({ code: newCode, lang: newLang }) => {
  if (newCode !== editableInput.value?.innerText) {
    editableCode.value = formatCode(newCode, newLang)
    presentedCode.value = editableCode.value
    if (editableInput.value) {
      editableInput.value.innerText = editableCode.value
      setCursorPosition(cursorPosition.value, true)
    }
  }
}, { immediate: true })

</script>

<style lang="scss" scoped>
.editable-code-wrapper {
  font-family: var(--kui-font-family-code, $kui-font-family-code);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  position: relative;

  .editable-code {
    background: transparent;
    caret-color: black;
    color:transparent;
    font-family: var(--kui-font-family-code, $kui-font-family-code);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    left: 34px;
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    min-width: fit-content;
    outline: none;
    position:absolute;
    top: 8px;
    white-space: break-spaces;
    word-wrap: break-word;
  }

  &.error-wrapper {
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-danger, $kui-color-border-danger);
  }
}
</style>
