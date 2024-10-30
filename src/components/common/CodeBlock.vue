<template>
  <div>
    <!-- eslint-disable vue/no-v-html -->
    <div
      v-if="highlightedCode"
      class="code-block"
      v-html="highlightedCode"
    />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '@/composables'
import { requestSampleConfigs } from '@/constants'
import type { LanguageCode } from '@/types/request-languages'

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
const { highlighter } = composables.useShiki()

const getHighlightLanguage = (snippetLang: LanguageCode | null | undefined): string | null | undefined => {
  return requestSampleConfigs.find(c => c.httpSnippetLanguage === snippetLang)?.highlightLanguage
}

const highlightedCode = computed(():string => {
  if (highlighter.value && props.lang) {
    const hightLightLang = getHighlightLanguage(props.lang as LanguageCode)
    return highlighter.value.codeToHtml(props.code, { lang: hightLightLang as string, theme: 'catppuccin-latte' })
  }
  return ''
})
</script>

<style lang="scss" scoped>
.code-block {
  :deep(pre) {
    @include pre;

    border: none;
    border-radius: 0;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    margin: var(--kui-space-0, $kui-space-0);
    max-height: 300px;
    overflow-y: auto;
    padding: var(--kui-space-40, $kui-space-40);
    white-space: break-spaces;

    code {
      background: transparent !important;
      white-space: break-spaces;
      word-wrap: break-word;
    }

    $codeblock-line-count-width: 4ch;
    $codeblock-line-gap: 1px;

    span.line {
      counter-increment: codeblock-line;
      display: inline-block;
      font-family: var(--kui-font-family-code, $kui-font-family-code);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      min-height: 16px; // this is to enforce height on empty line
      min-width: fit-content;
      padding-left: calc(#{$codeblock-line-count-width} + 6px);
      position: relative;
      word-break: break-all;

      &::after {
        background-color: transparent;
        bottom: 0;
        color: var(--kui-color-text-neutral, $kui-color-text-neutral-weak);
        content: counter(codeblock-line);
        left: 0;
        padding-right: calc(#{$codeblock-line-gap} * 2);
        position: absolute;
        right: 0;
        text-align: right;
        top: 0;
        width: $codeblock-line-count-width;
      }
    }
  }
}
</style>
