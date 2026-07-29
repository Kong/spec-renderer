<template>
  <CodeBlock
    class="response-body"
    :code="text"
    :is-resizable="true"
    :lang="lang"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CodeBlock from '@/components/common/CodeBlock.vue'
import { CODE_INDENT_SPACES } from '@/constants'
import { maskBodyExample } from '@/utils'

const props = withDefaults(defineProps<{
  /** parsed JSON body (object/array/string/number/boolean/null) when lang is 'json', raw string otherwise */
  content?: unknown
  lang: 'json' | 'text'
  bodySchema?: Record<string, any>
  showSensitiveData?: boolean
}>(), {
  showSensitiveData: false,
})

// Builds the masked body — only applies to JSON, when a schema is available
const maskedText = computed((): string | null => {
  if (props.lang !== 'json' || !props.bodySchema) return null
  return JSON.stringify(maskBodyExample(props.content, props.bodySchema), null, CODE_INDENT_SPACES)
})

const text = computed((): string => {
  if (!props.showSensitiveData && maskedText.value !== null) return maskedText.value
  if (props.lang === 'json') return JSON.stringify(props.content, null, CODE_INDENT_SPACES)
  return String(props.content ?? '')
})
</script>

<style lang="scss" scoped>
:deep(.response-body pre) {
  height: 200px;
}
</style>
