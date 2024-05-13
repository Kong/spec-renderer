<template>
  <div>
    !!!!Unknown Node!!!!
    <br>
    {{ data }}
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { INode } from '@stoplight/types'

defineProps({
  data: {
    type: Object as PropType<INode>,
    required: true,
  },
})
</script>
