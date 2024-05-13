<template>
  <div>
    HttpService
    <br>
    {{ data }}
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpService } from '@stoplight/types'

defineProps({
  data: {
    type: Object as PropType<IHttpService>,
    required: true,
  },
})
</script>
