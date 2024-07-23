<template>
  <component :is="render" />
</template>

<script setup lang="ts">
import { h } from 'vue'
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
  dataTestid: {
    type: String,
    default: '',
  },
})

const render = () => h(props.tag, {
  innerHTML: mdRender(props.markdown),
  'data-testid': props.dataTestid,
})
</script>
