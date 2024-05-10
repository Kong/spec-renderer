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
    </section>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import QueryParamList from '@/components/document/endpoint/QueryParamList.vue'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})
</script>
