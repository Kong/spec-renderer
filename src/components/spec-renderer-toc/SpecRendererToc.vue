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
    <div
      v-if="showPoweredBy"
      class="powered-by"
    >
      <a
        class="powered-by-button secondary"
        href="https://api-documentation.dev/"
        target="_blank"
      >
        API documentation editor
        <ExternalLinkIcon
          decorative
          :size="KUI_ICON_SIZE_30"
        />
      </a>
      <a
        href="https://konghq.com"
        target="_blank"
      >Powered by Kong</a>
    </div>
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
import { ExternalLinkIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'

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
  /** Show the "Powered by Kong" content in the SpecRendererTOC. Defaults to `false`. */
  showPoweredBy: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;

  > ul {
    margin: var(--kui-space-0, $kui-space-0);
    overflow-x: hidden;
    overflow-y: auto;
    padding-left: var(--kui-space-0, $kui-space-0);

    > *:first-child + * {
      // reduce spacing to very first group item following the overview
      padding-top: var(--kui-space-50, $kui-space-50);
    }
  }
}

.powered-by {
  background-color: var(--kui-color-background, $kui-color-background);
  border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  bottom: 0;
  box-sizing: border-box;
  padding: var(--kui-space-70, $kui-space-70);
  text-align: center;
  user-select: none;

  a {
    box-sizing: border-box;
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-family: var(--kui-font-family-text, $kui-font-family-text);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    text-decoration: none;
    transition: color 0.2s ease-in-out;

    &:not(.powered-by-button):hover {
      color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
      text-decoration: underline;
    }
  }
}

.powered-by-button {
  @include button-default;
  box-sizing: border-box;
  display: flex;
  margin-bottom: var(--kui-space-30, $kui-space-30);
  text-decoration: none;
  width: 100%;
}
</style>
