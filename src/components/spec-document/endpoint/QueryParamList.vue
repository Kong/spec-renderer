<template>
  <div class="query-param-list">
    <h5>Query Parameters</h5>
    <div
      v-for="queryParam in queryParamList"
      :key="queryParam.id"
      class="query-param-list-item"
    >
      <ModelProperty
        v-if="queryParam.schema"
        :property="{...queryParam.schema, ...populateQueryParamProperty(queryParam) }"
        :property-name="queryParam.name"
        :required-fields="queryParamItemRequiredFields(queryParam)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpQueryParam } from '@stoplight/types'
import ModelProperty from '../ModelProperty.vue'
import type { SchemaObject } from '@/types'

defineProps({
  queryParamList: {
    type: Array as PropType<Array<IHttpQueryParam>>,
    required: true,
  },
})

// some fields might not be available in the quer params schema, so we populate them from the query param itself
const populateQueryParamProperty = (queryParam: IHttpQueryParam) => {
  if (!queryParam.schema) return null

  const property: SchemaObject = {}
  if (queryParam.description && !property?.description) {
    // sometimes description for query param is not present in the schema
    // and is instead added to the query param itself
    property.description = queryParam.description
  }

  return property
}

/**
 * If the queryParam's schema has required fields, we use it.
 * Else, we use the `required` boolean field of the queryParam itself to determine if the field is required.
 */
const queryParamItemRequiredFields = (queryParam: IHttpQueryParam) => {
  if (queryParam.schema?.required) {
    return queryParam.schema?.required
  }
  return queryParam.required ? [queryParam.name] : []
}
</script>
