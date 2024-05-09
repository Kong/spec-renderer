<template>
  <div :data-testid="`http-operation-${data.id}`">
    <section>
      <h3>{{ data.summary }}</h3>
      <p>{{ data.description }}</p>
    </section>

    <section v-if="data.request">
      <h4>Request</h4>
      <div v-if="data.request.query?.length">
        <h5>Query Parameters</h5>
        <div>
          <div
            v-for="queryParam in data.request.query"
            :key="queryParam.id"
          >
            <PropertyInfo
              :format="queryParam.schema?.format"
              :property-type="queryParam.schema?.type"
              :required-fields="queryParam.schema?.required"
              :title="queryParam.name"
            />

            <PropertyDescription
              v-if="queryParam.description"
              :description="queryParam.description"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import PropertyInfo from './property-fields/PropertyInfo.vue'
import PropertyDescription from './property-fields/PropertyDescription.vue'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})
</script>
