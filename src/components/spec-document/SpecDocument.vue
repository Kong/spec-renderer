<template>
  <div class="spec-renderer-document">
    <component
      :is="docComponent.component"
      v-if="docComponent.component"
      v-bind="docComponent.props"
    />
  </div>
</template>

<script setup lang="ts">
import { watch, ref, provide, computed } from 'vue'
import type { PropType, Ref } from 'vue'
import { NodeType } from '@stoplight/types'
import type { ServiceNode } from '../../stoplight/elements/utils/oas/types'
import HttpService from './HttpService.vue'
import HttpOperation from './HttpOperation.vue'
import HttpModel from './HttpModel.vue'
import ArticleNode from './ArticleNode.vue'
import UnknownNode from './UnknownNode.vue'

const props = defineProps({
  document: {
    type: Object as PropType<ServiceNode>,
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
const serviceNode = ref<ServiceNode | null>(null)

// to be consumed in multi-level child components
provide<Ref<string>>('base-path', computed((): string => props.basePath))
provide<Ref<boolean>>('hide-tryit', computed((): boolean => props.hideTryIt))

const emit = defineEmits < {
  (e: 'path-not-found', requestedPath: string): void
}>()

/** we show tryIt section when it's requested to be hidden and when node */

watch(() => ({ pathname: props.currentPath, document: props.document }), ({ pathname, document }) => {
  const isRootPath = !pathname || pathname === '/'
  serviceNode.value = <ServiceNode>(isRootPath ? document : document.children.find((child:any) => child.uri === pathname))
  if (!serviceNode.value) {
    emit('path-not-found', pathname)
  }
}, { immediate: true })

const docComponent = computed(() => {
  if (!serviceNode.value) return {}

  const defaultProps = {
    data: serviceNode.value.data,
  }

  switch (serviceNode.value.type as NodeType) {
    case NodeType.Article:
      return { component: ArticleNode, props: defaultProps }
    case NodeType.HttpOperation:
    case NodeType.HttpWebhook:
      return { component: HttpOperation, props: defaultProps }
    case NodeType.HttpService:
      return { component: HttpService, props: { ...defaultProps, specVersion: serviceNode.value.specVersion } }
    case NodeType.Model:
      return { component: HttpModel, props: { ...defaultProps, title: serviceNode.value.name } }
    default:
      return { component: UnknownNode, props: defaultProps }
  }
})
</script>

<style lang="scss" scoped>
.spec-renderer-document {
  background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
  box-sizing: border-box;
  color: var(--kui-color-text, $kui-color-text);
}
</style>
