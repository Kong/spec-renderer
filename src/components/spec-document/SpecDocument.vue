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
    v-else-if="serviceNode"
    ref="scrollableContainerRef"
    class="scrolling-container"
  >
    <div
      v-for="(node, idx) in nodesList"
      :id="`${idx}-nodecontainter`"
      :key="`${node.doc.data.id}-${idx}`"
      class="spec-renderer-document"
    >
      <div v-if="node.component">
        <component
          :is="node.component"
          v-if="['true', 'forced'].includes(toRenderer[idx])"
          v-bind="node.props"
        />
        <div
          v-else
          class="placeholder"
        >
          <h1>
            {{ node.doc.name }}
          </h1>
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
//import { vElementVisibility } from '@vueuse/components'
import { useWindowScroll, useWindowSize } from '@vueuse/core'
import { SECTIONS_TO_RENDER, MIN_SCROLL_DIFFERENCE } from '@/constants'
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
  /**
   * Allow component itself to control URL in browser URL.
   * When false it becomes the responsibility of consuming app
   */
  controlAddressBar: {
    type: Boolean,
    default: false,
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
  (e: 'path-not-found', requestedPath: string): void,
  (e: 'content-scrolled', path: string): void,
}>()

// forced - assumed visible (rendered) even when hidden
const toRenderer = ref<Array<'true' | 'false' | 'forced'>>(['true', 'forced', 'forced'])
const lastY = ref<number>()

const scrollableContainerRef = ref<HTMLElement | null>(null)


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



const { y: yPosition } = useWindowScroll()
const { height: windowHeight, width: windowWidth } = useWindowSize()


const docComponent = computed(() => {
  return getDocumentComponent(serviceNode.value)
})



const nodesList = computed(() => {
  let nList = <any[]>[]
  // first one - overview
  nList.push(...[props.document])
  console.log('nList here:', nList)

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
  console.log('nList', nList)
  return nList
})


watch(() => ({ nodesList: nodesList.value,
  yPosition: yPosition.value,
  scrollableRef: scrollableContainerRef.value,
  wHeight: windowHeight.value,
  wWidth: windowWidth.value }), (newValue, oldValue) => {
  console.log('currentlyVisible changed: ', newValue.yPosition, lastY.value)

  if (!newValue.nodesList) {
    return
  }

  if (!newValue.scrollableRef) {
    return
  }
  if (oldValue?.wHeight !== newValue.wHeight || oldValue?.wWidth != newValue.wWidth ) {
    lastY.value = undefined
  }

  if (lastY.value != undefined
    && Math.abs(newValue.yPosition - lastY.value) < MIN_SCROLL_DIFFERENCE) {
    return
  }

  const visibleEls = Array.from(newValue.scrollableRef.children).filter((c, i) => {
    const cEl = c as HTMLElement
    console.log('checking:', i, ' cEl.offsetTop:', cEl.offsetTop, ' container.offsetHeight: ', newValue.wHeight)
    if (cEl.offsetTop + newValue.yPosition > newValue.wHeight) {
      return false
    }
    return true

  })
  console.log('visibleEls: ', visibleEls)

  lastY.value = newValue.yPosition

  // we look trough elements and find the one that should be visible
}, { immediate: true })

// watch(yPosition, (newValue, oldValue) => {

//   if (!processScroll.value) {
//     setTimeout(()=>{
//       processScroll.value = true
//     }, 1000)
//   } else {
//     scrollDirection.value = newValue > oldValue ? 'down' : 'up'
//   }
// })


// const onElementVisibility = async (state: boolean, path: string, idx: number, forceExact: boolean) => {

//   if (!forceExact && !processScroll.value) {
//     return
//   }

//   console.log({ state, path, idx, prev: prevVisibilityCall.value })

//   // nothing was changed for state = false
//   if (!state && (!currentlyRendered.value[idx] || currentlyRendered.value[idx] === 'false')) {
//     return
//   }

//   // nothing was changed for state = true
//   if (state && currentlyRendered.value[idx] === 'true') {
//     return
//   }

//   // to avoid endless loop (same section changes from true to false and back)
//   if (
//     prevVisibilityCall.value && prevVisibilityCall.value.idx === idx &&
//     (
//       (state === false && prevVisibilityCall.value.state === true) ||
//       (state === true && prevVisibilityCall.value.state === false)
//     )
//   ) {
//     console.log('endlress loop???')
//     //return
//   }


//   prevVisibilityCall.value = { state, path, idx }

//   console.log('onElementVisibility', state, path, idx)

//   const currentRenderState = [...currentlyRendered.value]
//   currentRenderState[idx] = state ? 'true' : 'false'

//   // now we rest all 'forced' to false
//   for (let i = 0; i < currentRenderState.length; i++) {
//     if (currentRenderState[i] === 'forced') {
//       currentRenderState[i] = 'false'
//     }
//     // we want to keep values for 10 neighbors ofo current idx
//     if (['forced', 'true'].includes(currentRenderState[i]) && (i < idx - 10 || i > idx + 10)) {
//       currentRenderState[i] = 'false'
//     }
//   }

//   // now we add 'forced' from the left and right of true
//   const idxToForce = []
//   for (let i = 0; i < currentRenderState.length; i++) {
//     if (currentRenderState[i] === 'true') {
//       //        console.log('found visible at', i, currentRenderState[i])
//       for (let j = 1; j <= SECTIONS_TO_RENDER; j++) {
//         idxToForce.push(i - j)
//         idxToForce.push(i + j)
//       }
//     }
//   }
//   //    console.log('idxToForce:', idxToForce)
//   for (let i = 0 ; i < idxToForce.length; i++) {
//     if (idxToForce[i] >= 0 && currentRenderState[idxToForce[i]] !== 'true') {
//       currentRenderState[idxToForce[i]] = 'forced'
//     }
//   }

//   currentlyRendered.value = [...currentRenderState]

//   // now we find first visible path and fire scrolled
//   const firstVisibleIdx = forceExact ? idx : currentRenderState.findIndex(s=>s === 'true')
//   const firstVisiblePath = nodesList.value[firstVisibleIdx]?.doc.uri
//   if (firstVisiblePath ) {
//     console.log('!!!!!!!', firstVisiblePath, prevVisibilityCall.value, currentRenderState)
//     if (processScroll.value || forceExact) {
//       console.log('emmitting:' )
//       emit('content-scrolled', firstVisiblePath, scrollDirection.value)
//     }
//   }
//   // so it's only one change
//   //console.log('after idx:', idx, 'state:', state, currentlyRendered.value)
// }

/** we show tryIt section when it's requested to be hidden and when node */
watch(() => ({ pathname: props.currentPath, document: props.document }), async (newValue, oldValue) => {

  const { pathname, document } = newValue
  const { pathname: oldPathname, document: oldDocument } = oldValue || {}


  const isRootPath = !pathname || pathname === '/'
  serviceNode.value = <ServiceNode>(isRootPath ? document : document.children.find((child: any) => child.uri === pathname))

  if (!serviceNode.value) {
    emit('path-not-found', pathname)
    return
  }

  if (!props.allowContentScrolling) {
    // case when scrolling is not enabled - we do not need to do anything else
    return
  }

  if (oldDocument !== document) {
    // first one (service, and two bellow should be rendered by default)
    toRenderer.value = ['true', 'forced', 'forced']
    //processScroll.value = false
  }
  if (oldPathname) {
    //processScroll.value = false
  }

  // await nextTick()
  // // we need to give the the path and it's neighbors visible state
  // const pathIdx = nodesList.value.findIndex(node => node.doc.uri === pathname)
  // console.log('pathIdx:' ,pathIdx)

  // if (pathIdx === -1) {
  //   emit('path-not-found', pathname)
  //   return
  // }
  // onElementVisibility(true, pathname, pathIdx, true)

  // if (window?.document && oldPathname !== pathname) {
  //   console.log('?????', 'scrolling into', pathIdx)
  //   window.document.getElementById(`${pathIdx}-nodecontainter`)?.scrollIntoView()
  // }
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
  .overview-page, .spec-renderer-document {
    padding-bottom: var(--kui-space-100, $kui-space-100);
  }

  .placeholder {
    //background-color: red;
    min-height: 600px;
  }
}
</style>
