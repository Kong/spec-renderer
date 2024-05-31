<template>
  <div class="spec-renderer-document">
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
  currentPath: {
    type: String,
    required: true,
  },
  basePath: {
    type: String,
    default: '',
  },
  /**
   * Do not show TryIt section
  */
  hideTryIt: {
    type: Boolean,
    default: false,
  },
})
const serviceNode = ref<ServiceNode| null>(null)

// to be consumed in multi-level child components
provide<Ref<string>>('base-path', computed((): string => props.basePath))
provide<Ref<boolean>>('hide-tryit', computed((): boolean => props.hideTryIt))

/** we show tryIt section when it's requested to be hidden and when node */

watch(() => ({ pathname: props.currentPath, document: props.document }), ({ pathname, document }) => {
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
.spec-renderer-document {
    background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
    padding: var(--kui-space-60, $kui-space-60);

    * {
      margin: var(--kui-space-0, $kui-space-0);
    }
}
</style>
