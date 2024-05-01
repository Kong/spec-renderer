<template>
  <div class="table-of-contents">
    <ul>
      <component
        :is="itemComponent(item)"
        v-for="(item, idx) in tableOfContents"
        :key="idx+'_'+item.title"
        :item="item"
        @item-selected="selectItem"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import type { PropType } from 'vue'
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
provide<string>('base-patch', props.basePath)

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
  background-color: lightgray;
  overflow-y: auto;
  width: 500px;
  ul {
    list-style: none;
  }
}
</style>
