<template>
  <div :class="{ 'default-markdown': markdownStyles }">
    <component :is="render" />
  </div>
</template>

<script setup lang="ts">
import { h, inject, ref } from 'vue'
import type { Ref } from 'vue'
import useMarkdown from '@/composables/useMarkdown'

const { mdRender } = useMarkdown()

const props = defineProps({
  markdown: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    default: 'div',
  },
})

const render = () => h(props.tag, {
  innerHTML: mdRender(props.markdown),
})

const markdownStyles = inject<Ref<boolean>>('markdown-styles', ref(true))
</script>

<style lang="scss" scoped>
.default-markdown {
  :deep() {
    // Base font size and line height
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    line-height: var(--kui-line-height-40, $kui-line-height-40);

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      color: var(--kui-color-text, $kui-color-text);
      font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
      margin-top: var(--kui-space-0, $kui-space-0);
    }

    h1 {
      font-size: var(--kui-font-size-70, $kui-font-size-70);
      letter-spacing: var(--kui-letter-spacing-minus-50, $kui-letter-spacing-minus-50);
      line-height: var(--kui-line-height-60, $kui-line-height-60);
      margin-bottom: var(--kui-space-70, $kui-space-70);
    }

    h2 {
      font-size: var(--kui-font-size-60, $kui-font-size-60);
      letter-spacing: var(--kui-letter-spacing-minus-40, $kui-letter-spacing-minus-40);
      line-height: var(--kui-line-height-50, $kui-line-height-50);
      margin-bottom: var(--kui-space-60, $kui-space-60);
    }

    h3 {
      font-size: var(--kui-font-size-50, $kui-font-size-50);
      letter-spacing: var(--kui-letter-spacing-minus-30, $kui-letter-spacing-minus-30);
      line-height: var(--kui-line-height-40, $kui-line-height-40);
      margin-bottom: var(--kui-space-50, $kui-space-50);
    }

    h4 {
      font-size: var(--kui-font-size-40, $kui-font-size-40);
      letter-spacing: var(--kui-letter-spacing-minus-20, $kui-letter-spacing-minus-20);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
      margin-bottom: var(--kui-space-40, $kui-space-40);
    }

    h5,
    h6 {
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      letter-spacing: var(--kui-letter-spacing-minus-10, $kui-letter-spacing-minus-10);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
      margin-bottom: var(--kui-space-30, $kui-space-30);
    }

    // Adjust h2-p6 tags for scroll-to margin & padding
    // Exclude the h1 header
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: calc(var(--kui-space-20, $kui-space-20) * -1);
      padding-top: var(--kui-space-70, $kui-space-70);
      position: relative;

      a.header-anchor {
        fill: var(--kui-color-text, $kui-color-text);
        font-size: var(--kui-font-size-30, $kui-font-size-30);
        left: 0;
        line-height: 1;
        margin-left: calc(var(--kui-space-60, $kui-space-60) * -1);
        opacity: 0;
        padding-right: var(--kui-space-20, $kui-space-20);
        position: absolute;
        text-decoration: none;
        // stylelint-disable-next-line @kong/design-tokens/use-proper-token
        top: calc(var(--kui-space-80, $kui-space-80) + 2px);
        transition: opacity 0.2s ease-in-out;
        user-select: none;
      }

      &:hover {
        a.header-anchor {
          opacity: 1;
        }
      }
    }

    a {
      color: var(--kui-color-text-primary, $kui-color-text-primary);
      text-decoration: none;

      &:hover {
        color: var(--kui-color-text-primary-stronger, $kui-color-text-primary-stronger);
      }

      // Add external link icons
      &[href^="http://"],
      &[href^="https://"]
      {
        background-image: url("data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiBvdXRib3VuZCIKICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGFyaWEtaGlkZGVuPSJ0cnVlIiBhcmlhLWxhYmVsPSIob3BlbnMgbmV3IHdpbmRvdykiIGZvY3VzYWJsZT0iZmFsc2UiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgd2lkdGg9IjE1IiBoZWlnaHQ9IjE1Ij4KICA8cGF0aCBmaWxsPSIjYWFhIiBkPSJNMTguOCw4NS4xaDU2bDAsMGMyLjIsMCw0LTEuOCw0LTR2LTMyaC04djI4aC00OHYtNDhoMjh2LThoLTMybDAsMGMtMi4yLDAtNCwxLjgtNCw0djU2QzE0LjgsODMuMywxNi42LDg1LjEsMTguOCw4NS4xeiIgLz4KICA8cG9seWdvbiBmaWxsPSIjYWFhIiBwb2ludHM9IjQ1LjcsNDguNyA1MS4zLDU0LjMgNzcuMiwyOC41IDc3LjIsMzcuMiA4NS4yLDM3LjIgODUuMiwxNC45IDYyLjgsMTQuOSA2Mi44LDIyLjkgNzEuNSwyMi45IiAvPgo8L3N2Zz4K");
        background-position: right center;
        background-repeat: no-repeat;
        background-size: 16px 16px;
        padding-right: var(--kui-space-60, $kui-space-60);
      }
    }

    p {
      margin: var(--kui-space-0, $kui-space-0) var(--kui-space-0, $kui-space-0) var(--kui-space-70, $kui-space-70);
    }

    small {
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      line-height: var(--kui-line-height-20, $kui-line-height-20);
    }

    hr {
      border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      margin: var(--kui-space-70, $kui-space-70) var(--kui-space-0, $kui-space-0);
    }

    ul,
    ol {
      margin: var(--kui-space-0, $kui-space-0) var(--kui-space-0, $kui-space-0) var(--kui-space-70, $kui-space-70);

      // Remove the margin for a nested list
      ul,
      ol {
        margin: var(--kui-space-20, $kui-space-20) var(--kui-space-0, $kui-space-0) var(--kui-space-0, $kui-space-0)
          var(--kui-space-0, $kui-space-0);
        padding-left: var(--kui-space-90, $kui-space-90); // to prevent being cut off
      }

      li {
        margin-bottom: var(--kui-space-20, $kui-space-20);
      }
    }

    ul {
      list-style: disc;
    }

    ol {
      list-style: decimal;
    }

    blockquote {
      border-left: var(--kui-border-width-30, $kui-border-width-30) solid var(--kui-color-border, $kui-color-border);
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      margin: var(--kui-space-70, $kui-space-70) var(--kui-space-0, $kui-space-0);
      padding: var(--kui-space-0, $kui-space-0) var(--kui-space-70, $kui-space-70);
    }

    // inline code
    code {
      font-family: var(--kui-font-family-code, $kui-font-family-code);
    }

    // Inline code within the content area
    p code,
    td code {
      background: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
      border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
      color: var(--kui-color-text, $kui-color-text);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      padding: var(--kui-space-10, $kui-space-10) var(--kui-space-20, $kui-space-20);
      white-space: break-spaces;
      word-wrap: break-word;
    }

    pre {
      @include pre;
    }

    .line.highlighted {
      background-color: #eee;
      display: inline-block;
      width: 100%;
    }

    img {
      max-width: 100%;
    }

    table {
      border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      border-collapse: collapse;
      border-spacing: 0;
      color: var(--kui-color-text, $kui-color-text);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      margin-bottom: var(--kui-space-70, $kui-space-70);

      thead th {
        background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
        border: var(--kui-border-width-10, $kui-border-width-10) solid
          var(--kui-color-border-neutral-weaker, $kui-color-border-neutral-weaker);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        padding: var(--kui-space-40, $kui-space-40);
        vertical-align: text-top;
        white-space: nowrap;

        &:not(:last-of-type) {
          border-right-color: var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak);
        }
      }

      tbody td {
        border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
        padding: var(--kui-space-40, $kui-space-40);
        vertical-align: text-top;
      }
    }
  }
}
</style>
