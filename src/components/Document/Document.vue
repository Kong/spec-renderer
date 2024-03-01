<template>
  <div class="document-container">
    <component
      :is="docComponent(serviceNode)"
      v-if="serviceNode"
      :data="serviceNode.data"
    />
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import type { PropType } from 'vue'
import type { ServiceNode } from '../../stoplight/elements/utils/oas/types'
import { docComponent } from './index'
import { resolveRefs } from '../../utils/resolveRefs'
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
})
const serviceNode = ref<ServiceNode| null>(null)

watch(() => (props.path), (pathname) => {
  const isRootPath = !pathname || pathname === '/'
  serviceNode.value = isRootPath ? props.document : props.document.children.find((child:any) => child.uri === pathname)
  serviceNode.value.data = resolveRefs(serviceNode.value.data, props.json)
}, { immediate: true })
</script>

<style lang="scss" scoped>
.document-container {
  background-color: lightblue;
}
</style>
