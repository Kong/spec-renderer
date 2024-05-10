<template>
  <div>
    IHttpOperation
    <br>
    {{ data }}
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
