<template>
  <div
    v-if="!allowScrolling"
    class="spec-renderer-document"
  >
    <component
      :is="docComponent.component"
      v-if="docComponent.component !== null"
      v-bind="docComponent.props"
    />
  </div>
  <div
    v-else
    class="scrolling-container"
  >
    <component
      :is="rootDocumentComponent.component"
      v-if="rootDocumentComponent.component !== null"
      v-bind="rootDocumentComponent.props"
    />

    <div
      v-for="doc in document.children"
      :key="(doc.data as IHttpOperation).id"
      class="spec-renderer-document"
    >
      <component
        :is="getDocumentComponent(doc).component"
        v-if="getDocumentComponent(doc).component"
        v-bind="getDocumentComponent(doc).props"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, provide, computed } from 'vue'
import type { PropType, Ref } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import { NodeType } from '@stoplight/types'
import type { ServiceNode, ServiceChildNode } from '../../stoplight/elements/utils/oas/types'
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
  /**
   * URL to fetch spec document from
   */
  specUrl: {
    type: String,
    default: '',
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
  /**
   * Do not show  Insomnia option in TryIt
   */
  hideInsomniaTryIt: {
    type: Boolean,
    default: false,
  },
  /**
   * Allow scrolling trough operations/schemas
   */
  allowScrolling: {
    type: Boolean,
    default: true,
  },
})

const serviceNode = ref<ServiceNode | null>(null)

// to be consumed in multi-level child components
provide<Ref<string>>('spec-url', computed((): string => props.specUrl))
provide<Ref<string>>('base-path', computed((): string => props.basePath))
provide<Ref<boolean>>('hide-tryit', computed((): boolean => props.hideTryIt))
provide<Ref<boolean>>('hide-insomnia-tryit', computed((): boolean => props.hideInsomniaTryIt))

const emit = defineEmits < {
  (e: 'path-not-found', requestedPath: string): void
}>()

/** we show tryIt section when it's requested to be hidden and when node */

watch(() => ({ pathname: props.currentPath, document: props.document }), ({ pathname, document }) => {
  console.log('zzzz:', document)
  const isRootPath = !pathname || pathname === '/'
  serviceNode.value = <ServiceNode>(isRootPath ? document : document.children.find((child:any) => child.uri === pathname))
  if (!serviceNode.value) {
    emit('path-not-found', pathname)
  }
}, { immediate: true })

const getDocumentComponent = (forServiceNode: ServiceNode | ServiceChildNode | null) => {
  if (!forServiceNode) return {}

  const defaultProps = {
    data: forServiceNode.data,
  }

  switch (forServiceNode.type as NodeType) {
    case NodeType.Article:
      return { component: ArticleNode, props: defaultProps }
    case NodeType.HttpOperation:
    case NodeType.HttpWebhook:
      return { component: HttpOperation, props: defaultProps }
    case NodeType.HttpService:
      return { component: HttpService, props: { ...defaultProps, specVersion: (<ServiceNode>forServiceNode).specVersion } }
    case NodeType.Model:
      return { component: HttpModel, props: { ...defaultProps, title: forServiceNode.name } }
    default:
      return { component: UnknownNode, props: defaultProps }
  }
}

const docComponent = computed(() => {
  return getDocumentComponent(serviceNode.value)
})

const rootDocumentComponent = computed(() => {
  return getDocumentComponent(<ServiceNode>props.document)
})

</script>

<style lang="scss" scoped>
.spec-renderer-document {
  background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
  box-sizing: border-box;
  color: var(--kui-color-text, $kui-color-text);
}

.scrolling-container {
  .overview-page {
    padding-bottom: var(--kui-space-100, $kui-space-100);
  }
}
</style>
