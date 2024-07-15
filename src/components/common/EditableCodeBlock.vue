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
      @keyup="handleKeyUp"
    >
      {{ editableCode }}
    </div>
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

const emit = defineEmits<{
  (e: 'request-body-changed', newBody: string): void
}>()

const editableInput = ref<HTMLDivElement | null>()

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
  console.log('editableInput.value.childNodes:', editableInput.value.childNodes)
  for (let i = 0; editableInput.value.childNodes.length; i++) {
    console.log('editableInput.value.childNodes[i]', i, editableInput.value.childNodes[i])
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
  console.log('setting to:', rangeNode, rangePos)
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
  //console.log('row selection:', selection, selection.anchorNode?.textContent)
  const currentArray = editableInput.value.innerText.split('')

  const range = selection.rangeCount > 0 ? selection?.getRangeAt(0) : null
  if (range) {
    //    console.log(range)
    const clonedRange = range?.cloneRange()
    clonedRange?.selectNodeContents(editableInput.value)
    clonedRange?.setEnd(range.endContainer, range?.endOffset)

    // here we have a string but to carridge returns , so we would need to count number of \n  returns in this fragment
    let clonedRangeString = clonedRange.toString()
    const clonnedArray = clonedRangeString.split('')
    let currentPos = clonedRangeString.length
    // console.log('cloned:', JSON.stringify(clonnedArray), currentPos)
    // console.log('cArray:', JSON.stringify(currentArray))

    let idx = 0
    /*
    while (clonedRangeString && idx < editableInput.value.childNodes.length) {
      const cNode = editableInput.value.childNodes[idx]
      console.log('xxx:', idx, clonedRangeString, cNode.textContent?.length)
      if (clonedRangeString) {
        if (cNode.textContent?.length) {
          clonedRangeString = clonedRangeString.substring(cNode.textContent?.length)
        }
      }
      if (cNode.nodeName === 'BR') {
        console.log('increasing currentPos:', currentPos)
        currentPos++
      }
      idx++
    }

    return currentPos
    */
    let currentIdx = 0
    for (let i = 0; i < clonnedArray.length; i++) {
      if (clonnedArray[i] !== '\n' && currentArray[currentIdx] === '\n') {
        currentIdx++
        currentPos++
      }
      currentIdx++
    }
    if (selection.anchorOffset === 0 && currentArray[currentIdx] === '\n') {
      currentPos++
    }
    return currentPos
  }
  return 0
}

const handleKeyUp = (e: Event) => {
  console.log('cp:', getCursorPosition())
}

const handleInput = (e: Event) => {
  let cText = (e.target as HTMLElement).innerText
  console.log(e)
  if ((e as InputEvent).inputType === 'insertParagraph') {
    cursorPosition.value = getCursorPosition()
    console.log('cursorPosition.value', cursorPosition.value)
    if (cursorPosition.value > 1 && presentedCode.value) {
      const linesArray = presentedCode.value.split('\n')

      console.log(linesArray:', JSON.stringify(linesArray))
      let prevLine = ''
      let currentIdx = 0
      let lineIdx = 0
      // let's fine prev line where Enter was clicked
      do {
        console.log('starting:', lineIdx, linesArray[lineIdx], linesArray[lineIdx].length)
        currentIdx += linesArray[lineIdx].length
        console.log('starting:', lineIdx, linesArray[lineIdx].length)
        if (currentIdx >= cursorPosition.value) {
          prevLine = linesArray[lineIdx === 0 ? 0 : lineIdx - 1]
        }
        lineIdx++
      } while (prevLine === '' && lineIdx <= linesArray.length - 1)

      console.log('prevLine:', prevLine)
      if (prevLine) {
        let paddings = prevLine.replace(/[^\s].*/, '').length
        if (prevLine.endsWith('{') || prevLine.endsWith('[')) {
          paddings += 2
        }
        console.log('paddings:', paddings)
        if (paddings > 0) {
          // let's find number of spaces in the beginning and if more than 0 - increase the cursor position
          console.log('sp:', JSON.stringify(cText.substring(0, cursorPosition.value).split('')))
          console.log('ep:', JSON.stringify(cText.substring(cursorPosition.value).split('')))
          cText = cText.substring(0, cursorPosition.value) + Array(paddings + 1).join(' ') + cText.substring(cursorPosition.value)
          console.log('re:', JSON.stringify(cText.split('')))
          if (editableInput.value) {
            editableInput.value.innerText = cText
          }
          presentedCode.value = cText
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

  //return
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

watch(() => ({ code: props.code, lang: props.lang, editableInput: editableInput.value }), ({ code: newCode, lang: newLang, editableInput: newEditableInput }) => {
  //  console.log('in watch:', newCode, newLang, newEditableInput?.innerText)
  if (newCode !== newEditableInput?.innerText) {
    editableCode.value = formatCode(newCode, newLang)
    presentedCode.value = editableCode.value
    //    console.log('aaqaa:', newEditableInput)
    if (newEditableInput) {
      newEditableInput.innerText = editableCode.value
      setCursorPosition(0, false)
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
    //color: transparent;
    font-family: var(--kui-font-family-code, $kui-font-family-code);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    left: 34px;
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    min-width: fit-content;
    outline: none;
    // position: absolute;
    top: 8px;
    white-space: break-spaces;
    word-wrap: break-word;
  }

  &.error-wrapper {
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-danger, $kui-color-border-danger);
  }
}
</style>
