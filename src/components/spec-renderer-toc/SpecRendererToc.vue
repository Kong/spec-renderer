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
  /**
   * this is designed scrolling container for TOC, by default it's 'self', but it can be 'parent' like in case of portal
   * If this is not enough we could pass actual selector for this via another prop.
   */
  scrollingContainer: {
    type: String as PropType<'self' | 'parent'>,
    default: 'parent',
  },
  scrollDirection: {
    type: String as PropType<'up' | 'down'>,
    default: 'down',
  },
})

// to be consumed in multi-level child components
provide<Ref<string>>('base-path', computed((): string => props.basePath))
provide<Ref<string>>('current-path', computed((): string => props.currentPath))

const emit = defineEmits<{
  (e: 'item-selected', id: string): void,
}>()

const tocNavRef = ref<HTMLElement | null>(null)

const scrollableContainerRef = ref<HTMLElement | null>(null)


const { y: yPosition } = useScroll(scrollableContainerRef)


watch(() => ({ path: props.currentPath, navRef: tocNavRef.value }), async (newValue) => {
  await nextTick()
  console.log('yPos: activeItem changed', newValue.path, newValue.navRef)
  if (!newValue.navRef) {
    console.log('no navRef')
    return
  }
  scrollableContainerRef.value = props.scrollingContainer === 'self' ? newValue.navRef : newValue.navRef.parentElement
  if (!scrollableContainerRef.value) {
    console.log('yPos: no container')
    return
  }
  const activeItem = scrollableContainerRef.value.querySelector('li[data-spec-renderer-toc-active="true"]') as HTMLElement || null

  if (!activeItem) {
    console.log('yPos: no activeItem')
    return
  }
  console.log('yPos:', yPosition.value, ' aH:', activeItem.offsetHeight, ' aT:', activeItem.offsetTop, ' cH:', scrollableContainerRef.value.offsetHeight, scrollableContainerRef.value, activeItem)

  // we are too far above visible part, let's bring it back
  if (activeItem.offsetTop < yPosition.value) {
    activeItem.scrollIntoView({ behavior: 'instant', block: 'start' })
    return
  }

  if ((yPosition.value + scrollableContainerRef.value.offsetHeight) < (activeItem.offsetTop + 2 * activeItem.offsetHeight)) {
    activeItem.scrollIntoView({ behavior: 'instant', block: 'end' })
    return
  }


  // now we want to see if activeItem is visible and if not - we want to scroll it intoView
}, { immediate: true })


const selectItem = (id: any) => {
  console.log('inside of TOC selectItem')
  if (props.controlBrowserUrl) {
    window.history.pushState({}, '', props.basePath + id)
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
