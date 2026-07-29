<template>
  <CodeBlock
    :code="headersText"
    :is-resizable="true"
    lang="json"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import CodeBlock from '@/components/common/CodeBlock.vue'
import { CODE_INDENT_SPACES } from '@/constants'
import type { SecuritySchemeMaskRule } from '@/types'

const props = defineProps({
  response: {
    type: Object as PropType<Response>,
    default: undefined,
  },
  maskRules: {
    type: Array as PropType<SecuritySchemeMaskRule[]>,
    default: () => [],
  },
  showSensitiveData: {
    type: Boolean,
    default: false,
  },
})

// Builds the header list as JSON, replacing masked header values with their placeholder unless revealed
const headersText = computed((): string => {
  const headers = <Record<string, any>>{}
  if (props.response) {
    for (const pair of props.response.headers.entries()) {
      if (!props.showSensitiveData) {
        const maskedRule = props.maskRules.find(r => r.location === 'header' && r.paramName.toLowerCase() === pair[0].toLowerCase())
        headers[pair[0]] = maskedRule ? maskedRule.placeholder : pair[1]
      } else {
        headers[pair[0]] = pair[1]
      }
    }
  }
  return Object.keys(headers).length ? JSON.stringify(headers, null, CODE_INDENT_SPACES) : ''
})
</script>
