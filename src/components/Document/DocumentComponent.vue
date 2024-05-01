<template>
  <component
    :is="docComponent(serviceNode)"
    v-if="serviceNode"
    :data="serviceNode.data"
    :title="serviceNode.name"
  />
</template>

<script setup lang="ts">
import { watch, ref, provide } from 'vue'
import type { PropType } from 'vue'
import type { ServiceNode } from '../../stoplight/elements/utils/oas/types'
import { docComponent } from './index'
import { resolveRefs } from '../../utils'
const props = defineProps({
  document: {
    type: Object as PropType<ServiceNode>,
    required: true,
  },
  json: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  basePath: {
    type: String,
    default: '',
  },
})
const serviceNode = ref<ServiceNode| null>(null)

// to be consumed in multi-level child components
provide<string>('base-path', props.basePath)

watch(() => (props.path), (pathname) => {
  const isRootPath = !pathname || pathname === '/'
  // @ts-ignore
  serviceNode.value = isRootPath ? props.document : props.document.children.find((child:any) => child.uri === pathname)
  if (serviceNode.value) {
    // @ts-ignore
    serviceNode.value.data = resolveRefs(serviceNode.value.data, props.json)
  }
}, { immediate: true })
</script>
