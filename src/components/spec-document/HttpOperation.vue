<template>
  <div :data-testid="`http-operation-${data.id}`">
    <section>
      <h3>{{ data.summary }}</h3>
      <p>{{ data.description }}</p>
    </section>

    <section v-if="data.request">
      <h4>Request</h4>
      <QueryParamList
        v-if="data.request.query?.length"
        :query-param-list="data.request.query"
      />
      <PathParamList
        v-if="data.request.path?.length"
        :path-param-list="data.request.path"
      />

      <RequestBody
        v-if="data.request.body"
        :request-body="data.request.body"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import QueryParamList from '@/components/spec-document/endpoint/QueryParamList.vue'
import RequestBody from './endpoint/RequestBody.vue'
import PathParamList from './endpoint/PathParamList.vue'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})
</script>
