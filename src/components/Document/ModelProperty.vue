<template>
  <div
    class="model-property"
    :data-testid="`model-property-${propertyName}`"
  >
    <template v-if="isValidSchemaObject(property)">
      <component
        :is="fieldComponentMap[fieldName]"
        v-for="fieldName in orderedFieldList(property, propertyName.toString())"
        :key="fieldName"
        v-bind="fieldComponentProps({ property, fieldName, requiredFields, propertyTitle: propertyName.toString() })"
      />

      <details v-if="modelPropertyProps?.properties">
        <summary>Properties of <code>{{ propertyName }}</code></summary>
        <template v-if="schemaObjectProperties(property)?.properties">
          <ModelProperty
            v-for="(subProperty, subPropertyName) in modelPropertyProps.properties"
            :key="subPropertyName"
            :property="subProperty"
            :property-name="subPropertyName.toString()"
            :required-fields="modelPropertyProps.required"
          />
        </template>
      </details>
    </template>

    <div v-else>
      <code>{{ propertyName }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { fieldComponentProps, fieldComponentMap } from './property-fields'
import { isValidSchemaObject, schemaObjectProperties, orderedFieldList } from '@/utils'
import type { ReferenceObject, SchemaObject } from '@/types'

const props = defineProps({
  property: {
    type: Object as PropType<SchemaObject | ReferenceObject>,
    required: true,
  },
  propertyName: {
    type: String,
    required: true,
  },
  requiredFields: {
    type: Array as PropType<SchemaObject['required']>,
    default: () => [],
  },
})

const modelPropertyProps = computed(() => isValidSchemaObject(props.property) ? schemaObjectProperties(props.property) : null)
</script>

<style lang="scss" scoped>
.model-property {
  border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  padding: var(--kui-space-50, $kui-space-50) var(--kui-space-80, $kui-space-80);

  &>:not(:first-child) {
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}
</style>
