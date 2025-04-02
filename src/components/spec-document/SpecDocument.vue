<template>
  <div
    v-if="!doContentScrolling"
    class="spec-renderer-document"
  >
    <component
      :is="docComponent.component"
      v-if="docComponent.component !== null"
      v-bind="docComponent.props"
    />

    <DocumentNavigation
      v-if="neighborComponentList.length"
      :base-path="basePath"
      :navigation-type="navigationType"
      :neighbor-component-list="neighborComponentList"
      @item-selected="selectItem"
    />
  </div>
  <div
    v-else-if="serviceNode"
    ref="wrapperRef"
    class="nodes-wrapper"
  >
    <div
      v-for="(node, idx) in nodesList"
      :id="`${idx}-nodecontainer`"
      :key="`${node.doc.uri}-${idx}`"
      class="spec-renderer-document"
    >
      <div v-if="node.component">
        <component
          :is="node.component"
          v-if="['true', 'forced'].includes(toRenderer[idx])"
          v-bind="node.props"
        />
        <div
          v-else-if="renderPlain"
          class="placeholder"
        >
          {{ stringify(node.doc) }}
        </div>
        <div
          v-else
          class="placeholder"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, provide, computed, nextTick, onBeforeMount } from 'vue'
import { useMagicKeys, useWindowScroll, useWindowSize, useElementSize, useScroll, until, whenever } from '@vueuse/core'
import composables from '@/composables'
import type { PropType, Ref } from 'vue'
import { NodeType } from '@/types'
import type { ServiceNode, ServiceChildNode, DocumentNavigationItem } from '@/types'
import HttpService from './HttpService.vue'
import HttpOperation from './HttpOperation.vue'
import AsyncOperation from './AsyncOperation.vue'
import HttpModel from './HttpModel.vue'
import AsyncMessage from './AsyncMessage.vue'
import ArticleNode from './ArticleNode.vue'
import UnknownNode from './UnknownNode.vue'
import DocumentNavigation from './DocumentNavigation.vue'
import { SECTIONS_TO_RENDER, MIN_SCROLL_DIFFERENCE, DISABLE_SCROLLING_ITEMS_LIMIT } from '@/constants'
import { BOOL_VALIDATOR, IS_TRUE, isSsr, findMatchingNode } from '@/utils'
import type { NavigationTypes } from '@/types'
import { stringify, parse as parseFlatted } from 'flatted'
import type { TableOfContentsItem, TableOfContentsNode, TableOfContentsGroup } from '@/stoplight/elements-core'

const props = defineProps({
  document: {
    type: [Object, String],
    required: true,
  },
  /**
   * table of contents. when passed to the document we will use it to define the order of scrollable sections (nList)
   */
  tableOfContents: {
    type: [Object, String],
    default: null,
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
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
  /**
   * Do not show  Insomnia option in TryIt
   */
  hideInsomniaTryIt: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
  /**
   * Allow scrolling trough operations/schemas
   */
  allowContentScrolling: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: true,
  },
  /**
   * scrolling container that holds SpecDocument, use window by default
   */
  documentScrollingContainer: {
    type: String,
    default: '',
  },

  /**
   * Allow component itself to control URL in browser URL.
   * When false it becomes the responsibility of consuming app
   */
  controlAddressBar: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
  /**
      Defines how links are specified in toc
        path - id becomes part of the URL path.
        hash - uses the hash portion of the URL to keep the UI in sync with the URL.
  */
  navigationType: {
    type: String as PropType<NavigationTypes>,
    default: 'path',
  },
  /**
   * Use default markdown styling
   */
  markdownStyles: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: true,
  },
  /**
   * Allow user to add custom server url which will be added to the list of available servers
   */
  allowCustomServerUrl: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: true,
  },
  /**
   * Hide navigation buttons at the bottom of the document.
   * Only relevant when not in content scrolling mode.
   */
  hideNavigationButtons: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: true,
  },
})

const { highlighter, createHighlighter } = composables.useShiki()
const { initialize } = composables.useServerList()

// listen to Cmd+F to render the raw document for each endpoint to enable search
const keys = useMagicKeys()

whenever(keys['meta+f'], () => {
  renderPlain.value = true
}, { once: true })

const serviceNode = ref<ServiceNode | null>(null)

// to be consumed in multi-level child components
provide<Ref<string>>('spec-url', computed((): string => props.specUrl))
provide<Ref<string>>('base-path', computed((): string => props.basePath))
provide<Ref<boolean>>('hide-tryit', computed((): boolean => IS_TRUE(props.hideTryIt)))
provide<Ref<boolean>>('hide-insomnia-tryit', computed((): boolean => IS_TRUE(props.hideInsomniaTryIt)))
provide<Ref<boolean>>('markdown-styles', computed((): boolean => IS_TRUE(props.markdownStyles)))

const emit = defineEmits<{
  (e: 'path-not-found', requestedPath: string): void
  (e: 'content-scrolled', path: string): void
  (e: 'item-selected', id: string): void
}>()

// forced - assumed visible (rendered) even when hidden
const toRenderer = ref<Array<'true' | 'false' | 'forced'>>([])
const lastY = ref<number>()
const processScrolling = ref<boolean>(false)
const lastPath = ref<string>()
const wrapperRef = ref<HTMLElement | null>(null)
const renderPlain = ref<boolean>(false)

const specDocument = computed((): ServiceNode => {
  if (typeof props.document === 'string') {
    try {
      return <ServiceNode>parseFlatted(props.document)
    } catch {
      console.error('@kong/spec-renderer: error parsing provided document')
      return <ServiceNode>{}
    }
  }
  return <ServiceNode>props.document
})


const getDocumentComponent = (forServiceNode: ServiceNode | ServiceChildNode | null):
{
  component: any
  props: any
  doc: ServiceNode | ServiceChildNode
} | null => {
  if (!forServiceNode) return null

  const defaultProps = {
    data: forServiceNode.data,
  }
  switch (forServiceNode.type as unknown as typeof NodeType[keyof typeof NodeType]) {
    case NodeType.Article:
      return { component: ArticleNode, props: defaultProps, doc: forServiceNode }
    case NodeType.HttpOperation:
    case NodeType.HttpWebhook:
      return { component: HttpOperation, props: defaultProps, doc: forServiceNode }
    case NodeType.AsyncOperation:
      return { component: AsyncOperation, props: defaultProps, doc: forServiceNode }
    case NodeType.HttpService:
      return { component: HttpService, props: { ...defaultProps, specVersion: (<ServiceNode>forServiceNode).specVersion, allowCustomServerUrl: IS_TRUE(props.allowCustomServerUrl) }, doc: forServiceNode }
    case NodeType.Model:
      return { component: HttpModel, props: { ...defaultProps, title: forServiceNode.name }, doc: forServiceNode }
    case NodeType.AsyncMessage:
      return { component: AsyncMessage, props: { ...defaultProps, title: forServiceNode.name }, doc: forServiceNode }
    default:
      return { component: UnknownNode, props: defaultProps, doc: forServiceNode }
  }
}


const scrollingContainerEl = computed(():HTMLElement | null => {
  if (isSsr()) {
    return null
  }
  if (!props.documentScrollingContainer) {
    return null
  }
  return document.querySelector(props.documentScrollingContainer)
})

const { y: yPositionWindow } = useWindowScroll()
const { y: yPositionContainer } = useScroll(scrollingContainerEl.value)

const windowSize = useWindowSize()
const scrollableContainerSize = useElementSize(scrollingContainerEl.value)

const yPosition = computed(() => {
  return scrollingContainerEl.value ? yPositionContainer.value : yPositionWindow.value
})

const containerSize = computed(()=> {
  return scrollingContainerEl.value ? scrollableContainerSize : windowSize
})

const nodesList = computed(() => {
  let nList = []

  // first one - overview
  nList.push(...[specDocument.value])

  if (props.tableOfContents === null) {

    // first all without tags, but not schemas
    nList.push(...specDocument.value.children.filter(child => (child.tags || []).length === 0 && child.type !== 'model'))

    // next by tag ordered
    specDocument.value.tags.forEach((t: string) => {
      nList.push(...specDocument.value.children.filter((child: any) => (child.tags || []).includes(t)))
    })

    // next - where tag is not matching list of tags
    nList.push(...specDocument.value.children.filter(child => {
      if (!child.tags || child.tags.length === 0) {
        return false
      }
      return !!child.tags.find( (childTag) => (!specDocument.value.tags.includes(childTag)))
    }))


    // very last - schemas
    nList.push(...specDocument.value.children.filter(child => (child.tags || []).length === 0 && child.type === 'model'))
  } else {
    let toc = props.tableOfContents
    if (typeof props.tableOfContents === 'string') {
      try {
        toc = <TableOfContentsItem[]>parseFlatted(toc as string)
      } catch {
        console.error('@kong/spec-renderer: error parsing provided toc')
      }
    }

    const crawl = (item: TableOfContentsGroup): void => {
      if (!Array.isArray(item.items)) {
        return
      }
      for (let i = 0; i < item.items.length; i++) {
        const childItem = item.items[i] as TableOfContentsNode
        if (childItem.id === '/') {
          continue
        }
        if ((item.items[i] as TableOfContentsGroup).items) {
          crawl((item.items[i] as TableOfContentsGroup))
        } else {
          const matchingNode = findMatchingNode(specDocument.value, childItem.id)
          if (matchingNode) {
            nList.push({ ...matchingNode, uri: childItem.id })
          }
        }
      }
    }
    crawl({ title: '', initiallyExpanded: false, items: <TableOfContentsItem[]>toc })
  }

  const docComponentList = []
  // transforming to components
  for (let i = 0; i < nList.length; i++) {
    const component = getDocumentComponent(nList[i])
    if (component) {
      docComponentList.push(component)
    }
  }
  return docComponentList
})

const activePathIdx = computed(() => nodesList.value.findIndex(node => node.doc.uri === props.currentPath))

const docComponent = computed(() => {
  return nodesList.value[activePathIdx.value]
})

const doContentScrolling = computed(():boolean => {
  return IS_TRUE(props.allowContentScrolling) && specDocument.value.children.length < DISABLE_SCROLLING_ITEMS_LIMIT
})

const hideNavigation = computed((): boolean => {
  return IS_TRUE(props.hideNavigationButtons) && specDocument.value.children.length < DISABLE_SCROLLING_ITEMS_LIMIT
})

const neighborComponentList = computed<Array<DocumentNavigationItem>>(() => {
  const list: Array<DocumentNavigationItem> = []

  if (hideNavigation.value || doContentScrolling.value) {
    return list
  }

  for (const idx of [-1, 1]) {
    const node = nodesList.value[activePathIdx.value + Number(idx)]

    if (node) {
      list.push({
        name: node.doc.name,
        uri: node.doc.uri,
        type: idx === -1 ? 'previous' : 'next',
        ...(node.doc.type === 'http_operation' && node.doc.data.method
          ? { method: node.doc.data.method }
          : {}),
      })
    }
  }

  return list
})

const selectItem = (newUrl: string): void => {
  if (IS_TRUE(props.controlAddressBar)) {
    // we only have path and hash for now
    const newPath = props.navigationType === 'path' ? props.basePath + newUrl : props.basePath + '#' + newUrl
    window.history.pushState({}, '', newPath)
  }

  emit('item-selected', newUrl)
}

const forceRenderer = (visibleIdx: number[]) => {
  const newToRenderer = Array(nodesList.value.length).fill('false', 0)
  visibleIdx.sort()

  for (let i = 0; i < newToRenderer.length; i++) {
    newToRenderer[i] = toRenderer.value[i]
    if (visibleIdx.includes(i)) {
      newToRenderer[i] = 'true'
    } else if (newToRenderer[i] !== 'true' && ((i - visibleIdx[visibleIdx.length - 1]) <= SECTIONS_TO_RENDER) && ((visibleIdx[0] - i) <= SECTIONS_TO_RENDER)) {
      newToRenderer[i] = 'forced'
    } else {
      // to remove already rendered uncomment this line
      //newToRenderer[i] = 'false'
    }
  }
  toRenderer.value = newToRenderer
}


watch(() => ({ nodesList: nodesList.value,
  yPosition: yPosition.value,
  wrapperRef: wrapperRef.value,
  wHeight: containerSize.value.height.value,
  wWidth: containerSize.value.width.value,
}), (newValue, oldValue) => {

  if (!doContentScrolling.value) {
    // case when scrolling is not enabled - we do not need to do anything else
    return
  }

  if (!processScrolling.value) {
    return
  }

  if (!newValue.nodesList) {
    return
  }

  if (!newValue.wrapperRef) {
    return
  }
  if (oldValue?.wHeight !== newValue.wHeight || oldValue?.wWidth != newValue.wWidth ) {
    lastY.value = undefined
  }

  if (lastY.value != undefined
    && Math.abs(newValue.yPosition - lastY.value) < MIN_SCROLL_DIFFERENCE) {
    return
  }
  const visibleEls:Array<Record<string, any>> = []
  const visibleIndexes: Array<number> = []
  Array.from(newValue.wrapperRef.children).forEach((c, i) => {
    const cEl = c as HTMLElement

    // this is below visible
    if (cEl.offsetTop - newValue.yPosition > newValue.wHeight) {
      return
    }
    // this is above visible
    if (cEl.offsetTop + cEl.offsetHeight < newValue.yPosition) {
      return
    }
    const cutFromTop = newValue.yPosition - cEl.offsetTop
    const cutFromBottom = cEl.offsetTop + cEl.offsetHeight - (newValue.yPosition + newValue.wHeight)
    const visibleHeight = cEl.offsetHeight - (cutFromTop < 0 ? 0 : cutFromTop) - (cutFromBottom < 0 ? 0 : cutFromBottom)
    const visibleHeightP:number = visibleHeight * 100 / cEl.offsetHeight
    visibleEls.push({ idx: i, cEl, vHp: visibleHeightP | 0 })
    visibleIndexes.push(i)
  })
  visibleEls.sort((e1, e2) => {
    return e1.vHp === e2.vHp ? 0 : e1.vHp > e2.vHp ? -1 : 1
  })

  if (visibleEls.length === 0) {
    lastY.value = newValue.yPosition
    return
  }


  // now out of all elements in visibleEls we  need to find the one that is most visible
  const mostVisibleIdx = visibleEls[0].idx
  forceRenderer(visibleIndexes)
  const newUri = nodesList.value[mostVisibleIdx].doc.uri
  if (newUri !== lastPath.value) {
    emit('content-scrolled', newUri)
    if (props.controlAddressBar) {
    // we only have path and hash for now
      const newPath = props.navigationType === 'path' ? props.basePath + newUri : props.basePath + '#' + newUri
      window.history.pushState({}, '', newPath)
    }
    lastPath.value = newUri
  }
  lastY.value = newValue.yPosition
  // we look trough elements and find the one that should be visible
}, { immediate: true })


/** we show tryIt section when it's requested to be hidden and when node */
watch(() => ({
  pathname: props.currentPath,
  document: specDocument.value }), async (newValue, oldValue) => {

  const { pathname, document: newDocument } = newValue
  const { document: oldDocument } = oldValue || {}

  const isRootPath = !pathname || pathname === '/'
  serviceNode.value = <ServiceNode>(isRootPath ? newDocument : findMatchingNode(newDocument, pathname))
  if (!serviceNode.value) {
    emit('path-not-found', pathname)
    return
  }

  if (oldDocument !== newDocument) {
    lastY.value = 0
    renderPlain.value = false

    // initialize the centralized state for server list
    initialize(serviceNode.value?.data.servers || [])
  }

  if (!doContentScrolling.value) {
    if (!highlighter.value) {
      await createHighlighter()
    }
    // case when scrolling is not enabled - we do not need to do anything else
    return
  }

  if (pathname === oldValue?.pathname && oldValue?.pathname) {
    return
  }
  if (pathname === lastPath.value) {
    // KHCP-14793 this is to prevent the unexected scrolljump
    return
  }

  processScrolling.value = false

  const pathIdx = nodesList.value.findIndex(node => node.doc.uri === pathname)
  forceRenderer([pathIdx])

  // the rest of this watcher only need to be executed when in non-ssr mode
  if (isSsr()) {
    return
  }

  await nextTick()


  // now we want to find position of the active element and if it is not visible force it to be visible
  if (document) {
    if (!wrapperRef.value) {
      // KHCP-15336 there is a case in portal when wrapperRef is not initialised at this pont
      await until(wrapperRef).not.toBeNull({ timeout: 10000 })
    }
    const activeSectionEl = wrapperRef.value?.querySelector(`[id="${pathIdx}-nodecontainer"]`)

    if (activeSectionEl) {
      /*
        special handling for pathIdx = 0 ('/' - we want to make sure entire container with what's on top is visible for this case,
        and yes, we still need to force scroll to fix KHCP-14499 for portal
      */
      if (pathIdx === 0) {
        if (!scrollingContainerEl.value) {
          window.scrollTo(0, 0)
        } else {
          scrollingContainerEl.value.scrollTo(0, 0)
        }
      } else {
        // KHCP-15336 - scrollIntoView likes to be in it's own timeout KHCP-15336
        console.log('activeSectionEl:', activeSectionEl)
        console.log('scrollingContainerEl:', scrollingContainerEl.value)

        setTimeout(()=> {
          // TDX-5469 - give it a little help for the first time scrolling into view when inside of scrollable container
          if (scrollingContainerEl.value) {
            scrollingContainerEl.value.scrollTo(0, (activeSectionEl as HTMLElement).offsetTop)
          }
          activeSectionEl.scrollIntoView({ behavior: 'instant' })
        }, 50)
      }
      lastPath.value = pathname
    }
    setTimeout(async () => {
      // now as we have our current section visible start re-drawing all the sections
      processScrolling.value = true
    }, 500)
  }
}, { immediate: true })


onBeforeMount(async () => {
  await createHighlighter()
})

</script>

<style lang="scss" scoped>
.spec-renderer-document {
  background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
  box-sizing: border-box;
  color: var(--kui-color-text, $kui-color-text);
  container: spec-document / inline-size;
  padding: var(--kui-space-40, $kui-space-40) var(--kui-space-0, $kui-space-0);

  :deep(details) {
    > summary {
      &::marker,
      &::-webkit-details-marker {
        display: none;
      }
    }
  }
}

.nodes-wrapper {
  .overview-page, .spec-renderer-document {
    margin-bottom: var(--kui-space-100, $kui-space-100);
    padding-bottom: var(--kui-space-100, $kui-space-100);
  }

  .spec-renderer-document {
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);

    &:last-child {
      border-bottom: none;
    }
  }

  .placeholder {
    height: 800px;
    max-height: 800px;
    opacity: 0;
    overflow: hidden;
  }
}
</style>
