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

const props = defineProps({
  tableOfContents: {
    type: Array as PropType<TableOfContentsItem[]>,
    required: true,
  },
  basePath: {
    type: String,
    default: '',
  },
  controlBrowserUrl: {
    type: Boolean,
    default: false,
  },
  /**
   * Selected path to load document with
   */
  currentPath: {
    type: String,
    default: '/',
  },
})

// to be consumed in multi-level child components
provide<Ref<string>>('base-path', computed((): string => props.basePath))
provide<Ref<string>>('current-path', computed((): string => props.currentPath))

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
  if (props.controlBrowserUrl) {
    window.history.pushState({}, '', props.basePath + id)
  }

  emit('item-selected', id)
}

const tocNavRef = ref<HTMLElement | null>(null)
</script>

<style lang="scss" scoped>
.table-of-contents {
  background-color: var(--kui-color-background-transparent, $kui-color-background-transparent); // transparent so that it doesn't interfere with the parent's background
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;

  > ul {
    padding-left: var(--kui-space-0, $kui-space-0);

    > *:first-child + * {
      // reduce spacing to very first group item following the overview
      padding-top: var(--kui-space-50, $kui-space-50);
    }
  }
}
</style>
