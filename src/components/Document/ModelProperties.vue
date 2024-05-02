<template>
  <div
    v-for="(property, key) in properties"
    :key="key"
    class="model-property"
  >
    <template v-if="isValidSchemaObject(property)">
      <component
        :is="fieldComponentMap[fieldName]"
        v-for="fieldName in orderedFieldList(property, key.toString())"
        :key="fieldName"
        v-bind="fieldComponentProps({ property, fieldName, requiredFields, propertyTitle: key.toString() })"
      />

      <template v-if="isValidSchemaObject(property.items)">
        <component
          :is="fieldComponentMap[fieldName]"
          v-for="fieldName in orderedFieldList(property.items)"
          :key="fieldName"
          v-bind="fieldComponentProps({ property: property.items, fieldName })"
        />
        <details v-if="isNestedObj(property.items)">
          <summary>Properties of items in <code>{{ key }}</code></summary>
          <ModelProperties
            :properties="property.items.properties"
            :required-fields="property.items.required"
          />
        </details>
      </template>

      <details v-if="isNestedObj(property)">
        <summary>Properties of <code>{{ key }}</code></summary>
        <ModelProperties
          :properties="property.properties"
          :required-fields="property.required"
        />
      </details>
    </template>

    <div v-else>
      <code>{{ key }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { fieldComponentProps, fieldComponentMap } from './SchemaProperties'
import { isValidSchemaObject } from '@/utils'
import type { SchemaObject } from '@/types'

defineProps({
  properties: {
    type: Object as PropType<SchemaObject['properties']>,
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
