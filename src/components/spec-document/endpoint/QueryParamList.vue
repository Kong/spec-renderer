<template>
  <div class="query-param-list">
    <h5>Query Parameters</h5>
    <div
      v-for="queryParam in queryParamList"
      :key="queryParam.id"
      class="query-param-list-item"
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
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpQueryParam } from '@stoplight/types'
import PropertyInfo from '../property-fields/PropertyInfo.vue'
import PropertyDescription from '../property-fields/PropertyDescription.vue'

defineProps({
  queryParamList: {
    type: Array as PropType<Array<IHttpQueryParam>>,
    required: true,
  },
})
</script>
