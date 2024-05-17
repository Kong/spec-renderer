<template>
  <div :data-testid="`http-operation-${data.id}`">
    <section>
      <h3>{{ data.summary }}</h3>
      <p>{{ data.description }}</p>
    </section>

    <HttpRequest
      v-if="data.request"
      v-bind="data.request"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import HttpRequest from './endpoint/HttpRequest.vue'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})
</script>
