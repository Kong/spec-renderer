<template>
  <CollapsibleSection
    class="query-param-list"
    data-testid="endpoint-query-param-list"
  >
    <template #title>
      <h2 class="query-param-list-title">
        Query Parameters
      </h2>
    </template>

    <div class="query-param-list-items">
      <template
        v-for="queryParam in queryParamList"
        :key="queryParam.id"
      >
        <ModelProperty
          v-if="queryParam.schema"
          :property="{...queryParam.schema, ...populateQueryParamProperty(queryParam) }"
          :property-name="queryParam.name"
          :required-fields="queryParamItemRequiredFields(queryParam)"
        />
      </template>
    </div>
  </CollapsibleSection>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpQueryParam } from '@stoplight/types'
import ModelProperty from '../schema-model/ModelProperty.vue'
import CollapsibleSection from './CollapsibleSection.vue'
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

<style lang="scss" scoped>
.query-param-list {
  .query-param-list-title {
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
  }
  .query-param-list-items {
    padding-bottom: var(--kui-space-60, $kui-space-60);
    padding-top: var(--kui-space-40, $kui-space-40);
  }
}
</style>
