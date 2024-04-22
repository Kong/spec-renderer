<template>
  HttpService
  <br>
  {{ data }}
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
