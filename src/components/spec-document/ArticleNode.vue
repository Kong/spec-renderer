<template>
  <div>
    Article
    <br>
    {{ data }}
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { INode } from '@stoplight/types'

// TODO: type def is missing for article need to add
defineProps({
  data: {
    type: Object as PropType<INode>,
    required: true,
  },
})
</script>
