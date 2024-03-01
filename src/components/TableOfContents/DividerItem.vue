<template>
  <li>
    {{ item.title }}
  </li>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { TableOfContentsDivider } from '../../stoplight/elements-core/components/Docs/types'

defineProps({
  item: {
    type: Object as PropType<TableOfContentsDivider>,
    required: true,
  },
})

</script>

<style lang="scss" scoped>
li {
  font-weight: bold;
  padding-top:20px;
}
</style>
