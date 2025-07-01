<template>
  <CollapsibleSection
    class="request-param-list"
    :title="title"
  >
    <div class="request-param-list-items">
      <template
        v-for="param in paramList"
        :key="param.id"
      >
        <ModelProperty
          v-if="param.schema"
          :property="{...param.schema, ...populateParamProperty(param, param.schema) }"
          :property-name="param.name"
          :required-fields="paramItemRequiredFields(param)"
        />
      </template>
    </div>
  </CollapsibleSection>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpParam } from '@stoplight/types'
import ModelProperty from '../schema-model/ModelProperty.vue'
import CollapsibleSection from './CollapsibleSection.vue'
import type { SchemaObject } from '@/types'

defineProps({
  paramList: {
    type: Array as PropType<IHttpParam[]>,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
})

// some fields might not be available in the quer params schema, so we populate them from the path param itself
const populateParamProperty = (param: IHttpParam, schema: SchemaObject) => {
  if (!param.schema) return null

  const property: SchemaObject = schema
  if (param.description && !property?.description) {
    // sometimes description for path param is not present in the schema
    // and is instead added to the path param itself
    property.description = param.description
  }

  return property
}

/**
 * If the param's schema has required fields, we use it.
 * Else, we use the `required` boolean field of the param itself to determine if the field is required.
 */
const paramItemRequiredFields = (param: IHttpParam) => {
  if (param.schema?.required) {
    return param.schema?.required
  }
  return param.required ? [param.name] : []
}
</script>

<style lang="scss" scoped>
.request-param-list {
  .request-param-list-items {
    > :not(:first-child) {
      border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    }
  }
}
</style>
