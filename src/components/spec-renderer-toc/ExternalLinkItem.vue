<template>
  <li>
    node-group-item
  </li>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { TableOfContentsNodeGroup } from '@/stoplight/elements-core'

defineProps({
  item: {
    type: Object as PropType<TableOfContentsNodeGroup>,
    required: true,
  },
})

</script>
