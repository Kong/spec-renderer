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
        :collapsed="itemCollapsed(item)"
        :item="item"
        @item-selected="selectItem"
      />
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { provide, computed, ref, nextTick } from 'vue'
import type { PropType, Ref } from 'vue'
import type { TableOfContentsItem } from '../../stoplight/elements-core/components/Docs/types'
import { itemComponent, isGroup } from './index'
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

const scrollToActiveItem = async (scrollableAncestor: HTMLElement = tocNavRef.value as HTMLElement): Promise<void> => {
  if (parent) {
    await nextTick() // wait for all parent groups to expand

    const activeItem = scrollableAncestor.querySelector('li[data-testid="node-item-active"]') as HTMLElement || null

    if (activeItem) {
      const offsetTop = getOffsetTopRelativeToParent(activeItem, scrollableAncestor)

      if (offsetTop !== null) {
        console.log('here1')

        parent.scrollTo({
          top: offsetTop - 50, // offset 50 so it doesn't stick to the top
          behavior: 'auto', // determined by the computed value of 'scroll-behavior' CSS property - so that host app has control over it
        })
      }
    }
  }
}

defineExpose({
  /**
   * Allow parent component to trigger scroll to active item.
   * Delegate triggering of scroll to parent component so that it doesn't happen automatically.
   * Depending on how this component is used (rendered in context of SpecRenderer or standalone), parent component can decide when/how to trigger scroll.
   */
  scrollToActiveItem,
})

const selectItem = (id: any) => {
  if (props.controlBrowserUrl) {
    window.history.pushState({}, '', props.basePath + id)
  }

  emit('item-selected', id)
}

const tocNavRef = ref<HTMLElement | null>(null)

const firstGroupItemExpanded = ref<boolean>(false)
const itemCollapsed = (item: TableOfContentsItem): boolean | undefined => {
  if (isGroup(item)) {
    if (firstGroupItemExpanded.value) {
      return true
    }

    firstGroupItemExpanded.value = true
    return false
  }

  // return undefined for non-group items (which don't accept `collapsed` prop)
  return undefined
}
</script>

<style lang="scss" scoped>
.table-of-contents {
  background-color: var(--kui-color-background-transparent, $kui-color-background-transparent); // transparent so that it doesn't interfere with the parent's background
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;

  > ul {
    padding-left: var(--kui-space-0, $kui-space-0);

    > *:first-child + * {
      // reduce spacing to very first group item following the overview
      padding-top: var(--kui-space-50, $kui-space-50);
    }
  }
}
</style>
