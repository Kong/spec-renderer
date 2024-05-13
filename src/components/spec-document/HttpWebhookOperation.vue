<template>
  <div>
    IHttpWebhookOperation
    <br>
    {{ data }}
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpWebhookOperation } from '@stoplight/types'

defineProps({
  data: {
    type: Object as PropType<IHttpWebhookOperation>,
    required: true,
  },
})
</script>
