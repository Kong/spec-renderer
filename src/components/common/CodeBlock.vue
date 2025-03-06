<template>
  <div>
    <VNode />
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import composables from '@/composables'
import { requestSampleConfigs } from '@/constants'
import type { LanguageCode } from '@/types/request-languages'
import { KUI_COLOR_BACKGROUND_NEUTRAL_WEAKEST, KUI_COLOR_BACKGROUND_NEUTRAL_STRONGEST } from '@kong/design-tokens'

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
    return highlighter.value.codeToHtml(props.code, {
      lang: hightLightLang as string,
      themes: {
        light: 'catppuccin-latte',
        dark: 'catppuccin-mocha',
      },
      colorReplacements: {
        'catppuccin-latte': {
          // Always use the neutral weakest token, fallback to **light** background
          '#eff1f5': `var(--kui-color-background-neutral-weakest, ${KUI_COLOR_BACKGROUND_NEUTRAL_WEAKEST})`,
        },
        'catppuccin-mocha': {
          // Always use the neutral weakest token, fallback to **dark** background
          '#1e1e2e': `var(--kui-color-background-neutral-weakest, ${KUI_COLOR_BACKGROUND_NEUTRAL_STRONGEST})`,
        },
      },
    })
  }
  return ''
})

const VNode = () => h('div', { class: 'code-block', innerHTML: highlightedCode.value })
</script>

<style lang="scss">
// Shiki code blocks; dark theme
html.dark,
[data-portal-color-mode="dark"] {
  .code-block {
    .shiki,
    .shiki span {
      /* stylelint-disable custom-property-pattern */
      /** !Important: The CSS custom property does not match the SCSS variable here purposefully so that it falls back to a dark color */
      --shiki-dark-bg: var(--kui-color-background-neutral-weakest, #{$kui-color-background-neutral-strongest});
      background-color: var(--shiki-dark-bg) !important;
      color: var(--shiki-dark) !important;
      /* Optional, if you also want font styles */
      font-style: var(--shiki-dark-font-style) !important;
      font-weight: var(--shiki-dark-font-weight) !important;
      text-decoration: var(--shiki-dark-text-decoration) !important;
      /* stylelint-enable custom-property-pattern */
    }
  }
}
</style>

<style lang="scss" scoped>
.code-block {
  :deep(pre) {
    @include pre;

    border: none;
    border-radius: var(--kui-border-radius-0, $kui-border-radius-0);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    margin: var(--kui-space-0, $kui-space-0);
    max-height: 300px;
    overflow-y: auto;
    padding: var(--kui-space-40, $kui-space-40);
    white-space: break-spaces;

    code {
      background: var(--kui-color-background-transparent, $kui-color-background-transparent) !important;
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
        background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
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
