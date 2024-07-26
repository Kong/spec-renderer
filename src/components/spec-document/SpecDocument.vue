<template>
  <div
    v-if="!allowContentScrolling"
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
      id="-1-nodecontainter"
      v-bind="rootDocumentComponent.props"
    />

    <div
      v-for="(node, idx) in nodesList"
      :id="`${idx}-nodecontainter`"
      :key="`${node.doc.data.id}-${idx}`"
      class="spec-renderer-document"
    >
      <div
        v-if="node.component"
        v-element-visibility=" (state: boolean)=> {onElementVisibility(state, node.doc.uri, idx)}"
      >
        <component
          :is="node.component"
          v-if="['true', 'forced'].includes(currentlyRendered[idx])"
          v-bind="node.props"
        />
        <div
          v-else
          class="placeholder"
        >
          <h1>
            {{ node.doc.name }} {{ idx }}
          </h1>
          Not visible
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, provide, computed, nextTick, onBeforeMount } from 'vue'
import type { PropType, Ref } from 'vue'
import { NodeType } from '@stoplight/types'
import type { ServiceNode, ServiceChildNode } from '../../stoplight/elements/utils/oas/types'
import HttpService from './HttpService.vue'
import HttpOperation from './HttpOperation.vue'
import HttpModel from './HttpModel.vue'
import ArticleNode from './ArticleNode.vue'
import UnknownNode from './UnknownNode.vue'
import { vElementVisibility } from '@vueuse/components'
import { SECTIONS_TO_RENDER } from '@/constants'
import composables from '@/composables'

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
  allowContentScrolling: {
    type: Boolean,
    default: true,
  },
})

const { createHighlighter } = composables.useShiki()

const serviceNode = ref<ServiceNode | null>(null)

// to be consumed in multi-level child components
provide<Ref<string>>('spec-url', computed((): string => props.specUrl))
provide<Ref<string>>('base-path', computed((): string => props.basePath))
provide<Ref<boolean>>('hide-tryit', computed((): boolean => props.hideTryIt))
provide<Ref<boolean>>('hide-insomnia-tryit', computed((): boolean => props.hideInsomniaTryIt))

const emit = defineEmits < {
  (e: 'path-not-found', requestedPath: string): void
}>()

// forced - assumed visible (rendered) even when hidden
const currentlyRendered = ref<Array<'true' | 'false' | 'forced'>>([])

// hold the values of previous onElementVisibility call to avoid endless loop
const prevVisibilityCall = ref<Record<string, any>>()

const getDocumentComponent = (forServiceNode: ServiceNode | ServiceChildNode | null) => {
  if (!forServiceNode) return {}

  const defaultProps = {
    data: forServiceNode.data,
  }

  switch (forServiceNode.type as NodeType) {
    case NodeType.Article:
      return { component: ArticleNode, props: defaultProps, doc: forServiceNode }
    case NodeType.HttpOperation:
    case NodeType.HttpWebhook:
      return { component: HttpOperation, props: defaultProps, doc: forServiceNode }
    case NodeType.HttpService:
      return { component: HttpService, props: { ...defaultProps, specVersion: (<ServiceNode>forServiceNode).specVersion }, doc: forServiceNode }
    case NodeType.Model:
      return { component: HttpModel, props: { ...defaultProps, title: forServiceNode.name }, doc: forServiceNode }
    default:
      return { component: UnknownNode, props: defaultProps, doc: forServiceNode }
  }
}

const docComponent = computed(() => {
  return getDocumentComponent(serviceNode.value)
})

const rootDocumentComponent = computed(() => {
  return getDocumentComponent(<ServiceNode>props.document)
})


const nodesList = computed(() => {
//  console.log('zzzzz', props.document)
  let nList = <any[]>[]
  // first all without tags, but not schemas
  nList.push(...props.document.children.filter(child => (child.tags || []).length === 0 && child.type !== 'model'))

  // next by tag ordered
  props.document.tags.forEach((t: string) => {
    nList.push(...props.document.children.filter((child: any) => (child.tags || []).includes(t)))
  })

  // next - where tag is not matching list of tags
  nList.push(...props.document.children.filter(child => {
    if (!child.tags || child.tags.length === 0) {
      return false
    }
    return !!child.tags.find( (childTag) => (!props.document.tags.includes(childTag)))
  }))


  // very last - schemas
  nList.push(...props.document.children.filter(child => (child.tags || []).length === 0 && child.type === 'model'))


  // transforming to components
  for (let i = 0; i < nList.length; i++) {
    nList[i] = getDocumentComponent(nList[i])
  }

  return nList
})


const onElementVisibility = (state: boolean, path: string, idx: number) => {
  // nothing was changed
  if (!state && (!currentlyRendered.value[idx] || currentlyRendered.value[idx] === 'false')) {
    return
  }

  // to avoid endless loop (same section changes from true to false and back)
  console.log({ state, path, idx, prev: prevVisibilityCall.value })
  if (prevVisibilityCall.value && prevVisibilityCall.value.idx === idx && state === false && prevVisibilityCall.value.state === true) {
    return
  }

  prevVisibilityCall.value = { state, path, idx }

  console.log('onElementVisibility', state, path, idx)

  const currentRenderState = [...currentlyRendered.value]
  currentRenderState[idx === -1 ? 0 : idx] = state ? 'true' : 'false'

  // first case: when there are no true, we set first one true
  if (currentRenderState.findIndex(c => c === 'true') === -1) {
    currentRenderState[0] = 'true'
  }
  // now we rest all 'forced' to false
  for (let i = 0; i < currentRenderState.length; i++) {
    if (currentRenderState[i] === 'forced') {
      currentRenderState[i] = 'false'
    }
  }

  // now we add 'forced' from the left and right of true
  const idxToForce = []
  for (let i = 0; i < currentRenderState.length; i++) {
    if (currentRenderState[i] === 'true') {
      //        console.log('found visible at', i, currentRenderState[i])
      for (let j = 1; j <= SECTIONS_TO_RENDER; j++) {
        idxToForce.push(i - j)
        idxToForce.push(i + j)
      }
    }
  }
  //    console.log('idxToForce:', idxToForce)
  for (let i = 0 ; i < idxToForce.length; i++) {
    if (idxToForce[i] >= 0 && currentRenderState[idxToForce[i]] !== 'true') {
      currentRenderState[idxToForce[i]] = 'forced'
    }
  }
  // so it's only one change
  currentlyRendered.value = [...currentRenderState]
  //console.log('after idx:', idx, 'state:', state, currentlyRendered.value)
}

/** we show tryIt section when it's requested to be hidden and when node */
watch(() => ({ pathname: props.currentPath, document: props.document }), async (newValue, oldValue) => {

  const { pathname, document } = newValue
  const { pathname: oldPathname, document: oldDocument } = oldValue || {}

  if (oldDocument !== document) {
    currentlyRendered.value = []
  }

  const isRootPath = !pathname || pathname === '/'
  serviceNode.value = <ServiceNode>(isRootPath ? document : document.children.find((child: any) => child.uri === pathname))
  if (!serviceNode.value) {
    emit('path-not-found', pathname)
  }

  if (!props.allowContentScrolling) {
    return
  }

  await nextTick()
  // we need to give the the path and it's neighbors visible state
  const pathIdx = nodesList.value.findIndex(node => node.doc.uri === pathname)
  console.log('pathIdx:' ,pathIdx)
  onElementVisibility(true, pathname, pathIdx)

  if (window?.document && oldPathname !== pathname) {
    await nextTick()
    console.log('AAAAAAA', `${pathIdx}-nodecontainter`, window.document.getElementById(`${pathIdx}-nodecontainter`))
    window.document.getElementById(`${pathIdx}-nodecontainter`)?.scrollIntoView()
  }
}, { immediate: true })

onBeforeMount(async ()=> {
  await createHighlighter()
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

  .placeholder {
    //background-color: red;
    min-height: 600px;
  }
}
</style>
