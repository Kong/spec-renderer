<template>
  <nav
    ref="tocNavRef"
    class="table-of-contents"
  >
    <ul>
      <component
        :is="itemComponent(item)"
        v-for="(item, idx) in tableOfContents"
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
import type { PropType, Ref } from 'vue'
import type { TableOfContentsItem } from '../../stoplight/elements-core/components/Docs/types'
import { itemComponent } from './index'
import { useScroll } from '@vueuse/core'
import type { NavigationTypes } from '@/types'

const props = defineProps({
  tableOfContents: {
    type: Array as PropType<TableOfContentsItem[]>,
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
   * this is designed scrolling container for TOC, by default it's 'self', but it can be 'parent' like in case of portal
   * If this is not enough we could pass actual selector for this via another prop.
   */
  tocScrollingContainer: {
    type: String as PropType<'self' | 'parent'>,
    default: 'parent',
  },
  /**
   * Allow component itself to control URL in browser URL.
   * When false it becomes the responsibility of consuming app
   */
  controlAddressBar: {
    type: Boolean,
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
provide<Ref<string>>('base-path', computed((): string => props.basePath))
provide<Ref<string>>('current-path', computed((): string => props.currentPath))
provide<Ref<NavigationTypes>>('navigation-type', computed((): NavigationTypes => props.navigationType))

const emit = defineEmits<{
  (e: 'item-selected', id: string): void,
}>()

const tocNavRef = ref<HTMLElement | null>(null)

const scrollableContainerRef = ref<HTMLElement | null>(null)


const { y: yPosition } = useScroll(scrollableContainerRef)


watch(() => ({ path: props.currentPath, navRef: tocNavRef.value }), async (newValue) => {
  //TODO verify if needed
  await nextTick()


  if (!newValue.navRef) {
    return
  }
  scrollableContainerRef.value = props.tocScrollingContainer === 'self' ? newValue.navRef : newValue.navRef.parentElement
  console.log('scrollableContainerRef.value:', scrollableContainerRef.value)
  if (!scrollableContainerRef.value) {
    return
  }
  const activeItem = scrollableContainerRef.value.querySelector('li[data-spec-renderer-toc-active="true"]') as HTMLElement || null

  if (!activeItem) {
    return
  }
  console.log('in TOC:', ' offsetTop:', activeItem.offsetTop, ' offsetHeight:', activeItem.offsetHeight, '  yPos:', yPosition.value, ' containerHeight:', scrollableContainerRef.value.offsetHeight )
  // we are too far above visible part, let's bring it back
  if (activeItem.offsetTop < yPosition.value) {
    activeItem.scrollIntoView({ behavior: 'instant', block: 'start' })
    return
  }

  if ((yPosition.value + (scrollableContainerRef.value.offsetHeight)) < (activeItem.offsetTop + 2 * activeItem.offsetHeight)) {
    activeItem.scrollIntoView({ behavior: 'instant', block: 'end' })
    scrollableContainerRef.value.scrollIntoView({ behavior: 'instant' })
    return
  }


  // now we want to see if activeItem is visible and if not - we want to scroll it intoView
}, { immediate: true })


const selectItem = (id: any) => {
  if (props.controlAddressBar) {
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
