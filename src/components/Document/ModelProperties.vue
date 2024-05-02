<template>
  <div
    v-for="(property, key) in properties"
    :key="key"
    class="model-property"
  >
    <template v-if="isValidSchemaObject(property)">
      <component
        :is="propertyComponentMap[fieldName]"
        v-for="(_, fieldName) in property"
        :key="fieldName"
        v-bind="propertyComponentProps({ property, fieldName, requiredFields, propertyTitle: key.toString() })"
      />

      <template v-if="isValidSchemaObject(property.items)">
        <component
          :is="propertyComponentMap[fieldName]"
          v-for="(_, fieldName) in property.items"
          :key="fieldName"
          v-bind="propertyComponentProps({ property: property.items, fieldName })"
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
import { propertyComponentProps, propertyComponentMap } from './SchemaProperties'
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
