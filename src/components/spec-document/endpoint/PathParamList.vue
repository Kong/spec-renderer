<template>
  <CollapsibleSection
    class="path-param-list"
    data-testid="endpoint-path-param-list"
    title="Path Parameters"
  >
    <div class="path-param-list-items">
      <template
        v-for="pathParam in pathParamList"
        :key="pathParam.id"
      >
        <ModelProperty
          v-if="pathParam.schema"
          :property="{...pathParam.schema, ...populatePathParamProperty(pathParam) }"
          :property-name="pathParam.name"
          :required-fields="pathParamItemRequiredFields(pathParam)"
        />
      </template>
    </div>
  </CollapsibleSection>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpPathParam } from '@stoplight/types'
import ModelProperty from '../schema-model/ModelProperty.vue'
import CollapsibleSection from './CollapsibleSection.vue'
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

<style lang="scss" scoped>
.path-param-list {
  .path-param-list-items {
    padding-bottom: var(--kui-space-60, $kui-space-60);
    padding-top: var(--kui-space-40, $kui-space-40);
  }
}
</style>
