<template>
  <li>
    <a
      href="#"
      @click="selectItem(item.id)"
    >
      {{ item.title }}
    </a>
  </li>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { TableOfContentsNode } from '../../stoplight/elements-core/components/Docs/types'

defineProps({
  item: {
    type: Object as PropType<TableOfContentsNode>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'item-selected', id: string): void
}>()

const selectItem = (id: string): void => {
  emit('item-selected', id)
}

</script>
