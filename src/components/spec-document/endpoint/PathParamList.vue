<template>
  <div
    class="path-param-list"
    data-testid="endpoint-path-param-list"
  >
    <h5>Path Parameters</h5>
    <div
      v-for="pathParam in pathParamList"
      :key="pathParam.id"
      class="path-param-list-item"
    >
      <ModelProperty
        v-if="pathParam.schema"
        :property="{...pathParam.schema, ...populatePathParamProperty(pathParam) }"
        :property-name="pathParam.name"
        :required-fields="pathParamItemRequiredFields(pathParam)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpPathParam } from '@stoplight/types'
import ModelProperty from '../ModelProperty.vue'
import type { SchemaObject } from '@/types'

defineProps({
  pathParamList: {
    type: Array as PropType<Array<IHttpPathParam>>,
    required: true,
  },
})

// some fields might not be available in the quer params schema, so we populate them from the path param itself
const populatePathParamProperty = (pathParam: IHttpPathParam) => {
  if (!pathParam.schema) return null

  const property: SchemaObject = {}
  if (pathParam.description && !property?.description) {
    // sometimes description for path param is not present in the schema
    // and is instead added to the path param itself
    property.description = pathParam.description
  }

  return property
}

/**
 * If the pathParam's schema has required fields, we use it.
 * Else, we use the `required` boolean field of the pathParam itself to determine if the field is required.
 */
const pathParamItemRequiredFields = (pathParam: IHttpPathParam) => {
  if (pathParam.schema?.required) {
    return pathParam.schema?.required
  }
  return pathParam.required ? [pathParam.name] : []
}
</script>
