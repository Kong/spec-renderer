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
import { computed, onMounted, ref } from 'vue'
import type { PropType } from 'vue'
import composables from '@/composables'
import { requestSampleConfigs } from '@/constants'
import type { LanguageCode } from '@/types/request-languages'
import type { HighlighterCore } from 'shiki/core'



const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  lang: {
    type: String,
    required: true,
  },
})
const { getHighlighter } = composables.useShiki()
const highlighter =ref<HighlighterCore>()

const getHighlightLanguage = (snippetLang: LanguageCode | null | undefined): string | null | undefined => {
  return requestSampleConfigs.find(c => c.httpSnippetLanguage === snippetLang)?.highlightLanguage
}
const highlightedCode = computed(():string => {
  if (highlighter.value) {
    const hightLightLang = getHighlightLanguage(props.lang as LanguageCode)
    return highlighter.value.codeToHtml(props.code, { lang: hightLightLang as string, theme: 'material-theme-lighter' })
  }
  return ''
})

onMounted(async ()=> {
  highlighter.value = await getHighlighter()
})

</script>

<style lang="scss" scoped>
:deep(pre) {
  margin: var(--kui-space-0, $kui-space-0);
  padding: var(--kui-space-40, $kui-space-40);
  white-space: pre-wrap;

  code {
    background: transparent !important;
    padding: var(--kui-space-0, $kui-space-0);
  }
}
</style>