<template>
  <li>
    {{ item.title }} >
    <ul>
      <component
        :is="itemComponent(child)"
        v-for="(child, idx) in item.items"
        :key="idx + ' ' + child.title+child"
        :item="child"
        @item-selected="selectItem"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { TableOfContentsGroup } from '../../stoplight/elements-core/components/Docs/types'
import { itemComponent } from './index'

defineProps({
  item: {
    type: Object as PropType<TableOfContentsGroup>,
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
