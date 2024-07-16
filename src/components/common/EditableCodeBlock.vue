<template>
  <div :class="{ 'editable-code-wrapper': true, 'error-wrapper': codeError }">
    <CodeBlock
      :code="presentedCode || ''"
      :lang="lang"
    />

    <div
      v-once
      ref="editableInput"
      class="editable-code"
      contenteditable="true"
      spellcheck="false"
      @focusout="handleFocusOut"
      @input="handleInput"
    >
      {{ editableCode }}
    </div>
  </div>
</template>

<script setup lang="ts">

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

const emit = defineEmits<{
  (e: 'request-body-changed', newBody: string): void
}>()

// ref to contentEditable element
const editableInput = ref<HTMLDivElement | null>()

// to hold editable code content
const editableCode = ref<string>()

// to hold presented code content
const presentedCode = ref<string>()

// holds codeError
const codeError = ref<boolean>(false)

// holds current cursor position
const cursorPosition = ref<number>(0)

/**
 * Setting cursor position on editableInput
 * @param customPosition
 * @param eol  (boolean, when true cursor is set to the end of the line)
 */
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
    if (rangePos - contentLen <= 0) {
      break
    }
    rangeNode++
    rangePos -= contentLen
    if (editableInput.value.childNodes[i].nodeName === 'BR') {
      rangePos--
    }
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



/**
 * get cursor position
 */
const getCursorPosition = () => {
  if (typeof window === 'undefined' || !editableInput.value) {
    return 0
  }
  const selection = window.getSelection()
  if (!selection) {
    return 0
  }
  const currentArray = editableInput.value.innerText.split('')

  const range = selection.rangeCount > 0 ? selection?.getRangeAt(0) : null
  if (range) {
    const clonedRange = range?.cloneRange()
    clonedRange?.selectNodeContents(editableInput.value)
    clonedRange?.setEnd(range.endContainer, range?.endOffset)

    // here we have a string but no \n -s , so we would need to count number of \n  in this fragment
    let clonedRangeString = clonedRange.toString()
    const clonnedArray = clonedRangeString.split('')
    let currentPos = clonedRangeString.length

    let currentIdx = 0
    for (let i = 0; i < clonnedArray.length; i++) {
      if (clonnedArray[i] !== '\n' && currentArray[currentIdx] === '\n') {
        currentIdx++
        currentPos++
      }
      currentIdx++
    }
    // this is the trick. when first line is `{` and custsor is on the begining on second line  we need to
    // increase position
    if (selection.anchorOffset === 0 && currentArray[currentIdx] === '\n') {
      currentPos++
    }
    return currentPos
  }
  return 0
}

/**
 * Handle Enter and backspace clicks
 *
 * @param e event
 */
const handleInput = (e: Event) => {
  let cText = (e.target as HTMLElement).innerText

  // On Enter do auto-indent
  if ((e as InputEvent).inputType === 'insertParagraph') {
    cursorPosition.value = getCursorPosition()

    // get the previous line and see how much it was indented
    if (cursorPosition.value > 1 && presentedCode.value) {
      const linesArray = presentedCode.value.split('\n')

      let prevLine = ''
      let currentIdx = 0
      let lineIdx = 0
      // let's fine prev line where Enter was clicked
      do {
        currentIdx += (linesArray[lineIdx].length + 1)
        if (currentIdx >= cursorPosition.value) {
          prevLine = linesArray[lineIdx]
        }
        lineIdx++
      } while (prevLine === '' && lineIdx <= linesArray.length - 1)

      if (prevLine) {
        let paddings = prevLine.replace(/[^\s].*/, '').length

        // if previous line ends with `{` or `[` - indent more
        if (prevLine.endsWith('{') || prevLine.endsWith('[')) {
          paddings += 2
        }

        if (paddings > 0) {
          // inject indentations

          cText = cText.substring(0, cursorPosition.value) + Array(paddings + 1).join(' ') + cText.substring(cursorPosition.value)
          if (editableInput.value) {
            editableInput.value.innerText = cText
          }
          // force presented code to the resulting one
          presentedCode.value = cText

          // force cursor postion to the end of the line
          setCursorPosition(cursorPosition.value, true)
        }
      }
    }
    presentedCode.value = cText
    return
  }


  if ((e as InputEvent).inputType === 'deleteContentBackward') {
    presentedCode.value = cText
    return
  }

  // on any other input cleating error, attempting to format and emitting change event
  // so that our requiest sample reactivly changes as we type
  codeError.value = false
  let resText = formatCode(cText, props.lang)
  presentedCode.value = resText
  cursorPosition.value = getCursorPosition()
  emit('request-body-changed', resText)
}

/**
 * handle focus out
 *
 * @param e
 */
const handleFocusOut = (e: Event) => {
  codeError.value = false
  const cText = (e.target as HTMLElement).innerText
  let resText = formatCode(cText, props.lang)
  editableCode.value = resText
  if (editableInput.value) {
    editableInput.value.innerText = editableCode.value
  }
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

watch(() => ({ code: props.code, lang: props.lang, editableInput: editableInput.value }),
  ({ code: newCode, lang: newLang, editableInput: newEditableInput }) => {
    if (newCode !== newEditableInput?.innerText) {
      editableCode.value = formatCode(newCode, newLang)
      presentedCode.value = editableCode.value
      if (newEditableInput) {
        newEditableInput.innerText = editableCode.value
        setCursorPosition(cursorPosition.value, true)
      }
    }
  }, { immediate: false })

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
    color: transparent;
    font-family: var(--kui-font-family-code, $kui-font-family-code);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    left: 34px;
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    min-width: fit-content;
    outline: none;
    position: absolute;
    top: 8px;
    white-space: break-spaces;
    word-wrap: break-word;
  }

  &.error-wrapper {
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-danger, $kui-color-border-danger);
  }
}
</style>
