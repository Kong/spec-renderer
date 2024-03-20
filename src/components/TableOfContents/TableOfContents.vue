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
})

const emit = defineEmits<{
  (e: 'item-selected', id: string): void
}>()

const selectItem = (id: any) => {
  window.history.pushState({}, '', props.basePath + id)
  emit('item-selected', id)
}

</script>

<style lang="scss" scoped>
.table-of-contents {
  background-color: lightgray;
  width: 500px;
  overflow-y: auto;
  ul {
    list-style: none;
  }
}
</style>
