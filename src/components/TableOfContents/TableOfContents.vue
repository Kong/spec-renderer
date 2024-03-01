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

defineProps({
  tableOfContents: {
    type: Array as PropType<TableOfContentsItem[]>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'item-selected', id: string): void
}>()

const selectItem = (id: any) => {
  emit('item-selected', id)
}

</script>

<style lang="scss" scoped>
.table-of-contents {
  max-height: 400px;
  overflow-y: auto;
  background-color: lightgray;
  ul {
    list-style: none;
  }
}
</style>
