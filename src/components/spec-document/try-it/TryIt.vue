<template>
  <div :data-testid="`tryit-${data.id}`">
    TryIt
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})
</script>
