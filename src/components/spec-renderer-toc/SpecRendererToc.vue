<template>
  <nav class="table-of-contents">
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
import { provide, computed } from 'vue'
import type { PropType, Ref } from 'vue'
import type { TableOfContentsItem } from '../../stoplight/elements-core/components/Docs/types'
import { itemComponent } from './index'

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
})

// to be consumed in multi-level child components
provide<Ref<string>>('base-path', computed((): string => props.basePath))

const emit = defineEmits<{
  (e: 'item-selected', id: string): void
}>()

const selectItem = (id: any) => {
  if (props.controlBrowserUrl) {
    window.history.pushState({}, '', props.basePath + id)
  }
  emit('item-selected', id)
}
</script>

<style lang="scss" scoped>
.table-of-contents {
  background-color: var(--kui-color-background, $kui-color-background);
  overflow-y: auto;
  overflow-x: hidden;
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
