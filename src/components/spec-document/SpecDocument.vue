<template>
  <div class="spec-render-doc">
    <component
      :is="docComponent(serviceNode)"
      v-if="serviceNode"
      :data="serviceNode.data"
      :title="serviceNode.name"
    />
  </div>
</template>

<script setup lang="ts">
import { watch, ref, provide, computed } from 'vue'
import type { PropType, Ref } from 'vue'
import type { ServiceNode } from '../../stoplight/elements/utils/oas/types'
import { docComponent } from './index'
import { removeCircularReferences } from '../../utils'
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
provide<Ref<string>>('base-path', computed((): string => props.basePath))

watch(() => ({ pathname: props.path, document: props.document }), ({ pathname, document }) => {
  const isRootPath = !pathname || pathname === '/'
  // @ts-ignore
  serviceNode.value = isRootPath ? document : document.children.find((child:any) => child.uri === pathname)
  if (serviceNode.value) {
    // removing circular references
    serviceNode.value.data = removeCircularReferences(serviceNode.value.data)

  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.spec-render-doc {
    background-color: var(--kui-color-background-transparent, $kui-color-background-transparent)
}
</style>
