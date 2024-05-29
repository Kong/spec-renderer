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
        @element-selected="scrollToElement"
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
  path: {
    type: String,
    default: '/',
  },
})

// to be consumed in multi-level child components
provide<Ref<string>>('base-path', computed((): string => props.basePath))
provide<Ref<string>>('current-path', computed((): string => props.path))

const emit = defineEmits<{
  (e: 'item-selected', id: string): void
}>()

const selectItem = (id: any) => {
  if (props.controlBrowserUrl) {
    window.history.pushState({}, '', props.basePath + id)
  }

  emit('item-selected', id)
}

const tocNavRef = ref<HTMLElement | null>(null)

const scrollToElement = async (element: any) => {
  if (typeof window !== 'undefined' && element instanceof HTMLElement && tocNavRef.value) {
    await nextTick() // wait for all parent groups to expand

    const offsetTop = getOffsetTopRelativeToParent(element, tocNavRef.value)

    if (offsetTop !== null) {
      tocNavRef.value.scrollTo({
        top: offsetTop - 50, // offset 50 so it doesn't stick to the top
        behavior: 'smooth',
      })
    }
  }
}

const firstGroupItemExpanded = ref<boolean>(false)
const itemCollapsed = (item: TableOfContentsItem): boolean | undefined => {
  if (isGroup(item)) {
    if (firstGroupItemExpanded.value) {
      return true
    }

    firstGroupItemExpanded.value = true
    return false
  }

  // return undefined for non-group items (which don't have accept `collapsed` prop)
  return undefined
}
</script>

<style lang="scss" scoped>
.table-of-contents {
  background-color: var(--kui-color-background, $kui-color-background);
  overflow-x: hidden;
  overflow-y: auto;
  position: relative; // important, need this for scrolling to selected item
  width: 100%;

  > ul {
    padding-left: var(--kui-space-0, $kui-space-0);

    > * {
      &:first-child {
        // overview item
        padding: var(--kui-space-70, $kui-space-70);
        padding-bottom: var(--kui-space-0, $kui-space-0);

        & + * {
          // very first group item following overview
          padding-top: var(--kui-space-50, $kui-space-50);
        }
      }
    }
  }
}
</style>
