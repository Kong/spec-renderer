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

    <section v-if="Array.isArray(data.responses) && data.responses.length">
      <h4>Response</h4>
      <HttpResponse
        v-for="response in data.responses"
        :key="response.code"
        :response="response"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import HttpRequest from './endpoint/HttpRequest.vue'
import HttpResponse from './endpoint/HttpResponse.vue'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})
</script>
