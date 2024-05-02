<template>
  <div
    class="model-property"
  >
    <template v-if="isValidSchemaObject(property)">
      <component
        :is="fieldComponentMap[fieldName]"
        v-for="fieldName in orderedFieldList(property, propertyName.toString())"
        :key="fieldName"
        v-bind="fieldComponentProps({ property, fieldName, requiredFields, propertyTitle: propertyName.toString() })"
      />

      <template v-if="isValidSchemaObject(property.items)">
        <component
          :is="fieldComponentMap[fieldName]"
          v-for="fieldName in orderedFieldList(property.items)"
          :key="fieldName"
          v-bind="fieldComponentProps({ property: property.items, fieldName })"
        />
        <details v-if="isNestedObj(property.items)">
          <summary>Properties of items in <code>{{ propertyName }}</code></summary>
          <ModelProperty
            v-for="(itemProperty, itemPropertyName) in property.items.properties"
            :key="itemPropertyName"
            :property="itemProperty"
            :property-name="itemPropertyName.toString()"
            :required-fields="property.items.required"
          />
        </details>
      </template>

      <details v-if="isNestedObj(property)">
        <summary>Properties of <code>{{ propertyName }}</code></summary>
        <ModelProperty
          v-for="(subProperty, subPropertyName) in property.properties"
          :key="subPropertyName"
          :property="subProperty"
          :property-name="subPropertyName.toString()"
          :required-fields="property.required"
        />
      </details>
    </template>

    <div v-else>
      <code>{{ propertyName }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { fieldComponentProps, fieldComponentMap } from './PropertyFields'
import { isValidSchemaObject } from '@/utils'
import type { ReferenceObject, SchemaObject } from '@/types'

defineProps({
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

const isNestedObj = (property: SchemaObject) => property.type === 'object' && property.properties && Reflect.ownKeys(property.properties).length

// We need to fix the order in which the components for these fields are rendered
const orderedFieldList = (itemData: SchemaObject, itemName?: string) => {
  const fields : Array<keyof SchemaObject> = []

  if (itemData.title || itemName) {
    fields.push('title')
  }
  if (itemData.description) {
    fields.push('description')
  }
  if (itemData.enum) {
    fields.push('enum')
  }
  if (itemData.example) {
    fields.push('example')
  }
  return fields
}
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
