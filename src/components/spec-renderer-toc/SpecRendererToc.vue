<template>
  <nav
    ref="tocNavRef"
    class="table-of-contents"
  >
    <ul>
      <component
        :is="itemComponent(item)"
        v-for="(item, idx) in tableOfContents"
        :key="idx+'_'+item.title"
        :item="item"
        @item-selected="selectItem"
      />
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { provide, computed, ref } from 'vue'
import type { PropType, Ref } from 'vue'
import type { TableOfContentsItem } from '../../stoplight/elements-core/components/Docs/types'
import { itemComponent } from './index'
import { getOffsetTopRelativeToParent } from '@/utils'
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

const getActiveItemScrollPosition = (scrollableAncestor: HTMLElement = tocNavRef.value as HTMLElement): number => {
  if (scrollableAncestor) {
    const activeItem = scrollableAncestor.querySelector('li[data-spec-renderer-toc-active="true"]') as HTMLElement || null

    if (!activeItem) {
      return 0
    }

    return getOffsetTopRelativeToParent(activeItem, scrollableAncestor) || 0
  }

  return 0
}

defineExpose({
  // comment has to stay here for intellisense to work
  /**
   * @description Get the scroll position of the active item within the scrollable ancestor.
   * Relies on the `data-spec-renderer-toc-active` attribute to determine the active item.
   * Because it uses HTMLElement: offsetParent property - it relies on the parent element to have a `position` other than `static` (ideally `relative`).
   * @param scrollableAncestor - the element to scroll within (optional, defaults to the root element of the component)
   * @returns the scroll position of the active item
   */
  getActiveItemScrollPosition,
})

const selectItem = (id: any) => {
  if (props.controlAddressBar) {
    // we only have path and hash for now
    const newPath = props.navigationType === 'path' ? props.basePath + id : props.basePath + '#' + id
    window.history.pushState({}, '', newPath)
  }

  emit('item-selected', id)
}

const tocNavRef = ref<HTMLElement | null>(null)
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
