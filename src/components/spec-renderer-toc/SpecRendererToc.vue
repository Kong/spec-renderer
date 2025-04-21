<template>
  <nav
    ref="tocNavRef"
    class="table-of-contents"
    data-testid="table-of-contents"
  >
    <ul>
      <component
        :is="itemComponent(item)"
        v-for="(item, idx) in toc"
        :key="idx + '_' + item.title"
        :active-path="currentPath"
        :item="item"
        @item-selected="selectItem"
      />
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { provide, computed, ref, watch, nextTick } from 'vue'
import type { PropType, ComputedRef } from 'vue'
import { itemComponent } from './index'
import { useScroll } from '@vueuse/core'
import type { NavigationTypes } from '@/types'
import type { TableOfContentsItem, TableOfContentsNode, TableOfContentsGroup } from '@/stoplight/elements-core'
import { BOOL_VALIDATOR, IS_TRUE } from '@/utils'
import { parse as parseFlatted } from 'flatted'

const props = defineProps({
  tableOfContents: {
    type: [Object, String],
    required: true,
  },
  /**
   * Path of the page where spec-renderer is loaded on.
   * his is needed to compute path to individual specification details
   */
  basePath: {
    type: String,
    default: '',
  },
  /**
   * Selected path of the spec section (ui)
   */
  currentPath: {
    type: String,
    default: '/',
  },
  /**
   * this is designed scrolling container for TOC, by default it's '',meaning tocNavRef scrollable.
   * If toc is part of some external list and that list is scrollable - we need a selector for that scollable container
   */
  tocScrollingContainer: {
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
})

// to be consumed in multi-level child components
provide<ComputedRef<string>>('base-path', computed((): string => props.basePath))
provide<ComputedRef<string>>('current-path', computed((): string => props.currentPath))
provide<ComputedRef<NavigationTypes>>('navigation-type', computed((): NavigationTypes => props.navigationType))

const emit = defineEmits<{
  (e: 'item-selected', id: string): void
}>()

const tocNavRef = ref<HTMLElement | null>(null)

const scrollableContainerRef = ref<HTMLElement | null>(null)


const { y: yPosition } = useScroll(scrollableContainerRef)

const toc = computed((): TableOfContentsItem[] | undefined => {

  if (!props.tableOfContents) {
    return undefined
  }

  let newToc = props.tableOfContents
  if (typeof props.tableOfContents === 'string') {
    try {
      newToc = <TableOfContentsItem[]>parseFlatted(newToc as string)
    } catch {
      console.error('@kong/spec-renderer: error parsing provided toc')
      return undefined
    }
  }
  const crawl = (item: TableOfContentsGroup, path: string): void => {
    if (!Array.isArray(item.items)) {
      return
    }
    for (let i = 0; i < item.items.length; i++) {
      if ((item.items[i] as TableOfContentsNode).id === path) {
        item.initiallyExpanded = true
      }
      crawl((item.items[i] as TableOfContentsGroup), path)
    }
  }
  crawl({ title: '', initiallyExpanded: false, items: <TableOfContentsItem[]>newToc }, props.currentPath)

  return <TableOfContentsItem[]>newToc
})

watch(() => ({ path: props.currentPath, navRef: tocNavRef.value }), async (newValue) => {
  await nextTick()


  if (!newValue.navRef || !document) {
    return
  }
  if (!scrollableContainerRef.value) {
    scrollableContainerRef.value = props.tocScrollingContainer === '' ? newValue.navRef : document.querySelector(props.tocScrollingContainer)
  }
  if (!scrollableContainerRef.value) {
    return
  }
  const activeItem = scrollableContainerRef.value.querySelector('li[data-spec-renderer-toc-active="true"]') as HTMLElement || null

  if (!activeItem) {
    return
  }
  // we are too far above visible part, let's bring it back
  if (activeItem.offsetTop < yPosition.value) {
    activeItem.scrollIntoView({ behavior: 'instant', block: 'start' })
    return
  }

  if ((yPosition.value + (scrollableContainerRef.value.offsetHeight)) < (activeItem.offsetTop + 2 * activeItem.offsetHeight)) {
    activeItem.scrollIntoView({ behavior: 'instant', block: 'end' })
    return
  }


  // now we want to see if activeItem is visible and if not - we want to scroll it intoView
}, { immediate: true })


const selectItem = (id: any) => {
  if (IS_TRUE(props.controlAddressBar)) {
    // we only have path and hash for now
    const newPath = props.navigationType === 'path' ? props.basePath + id : props.basePath + '#' + id
    window.history.pushState({}, '', newPath)
  }

  emit('item-selected', id)
}

</script>

<style lang="scss" scoped>
.table-of-contents {
  background-color: var(--kui-color-background-transparent, $kui-color-background-transparent); // transparent so that it doesn't interfere with the parent's background
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;

  > ul {
    margin: var(--kui-space-0, $kui-space-0);
    padding-left: var(--kui-space-0, $kui-space-0);

    > *:first-child + * {
      // reduce spacing to very first group item following the overview
      padding-top: var(--kui-space-50, $kui-space-50);
    }
  }
}
</style>
