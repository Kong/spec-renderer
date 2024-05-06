<template>
  <div
    v-for="(property, key) in properties"
    :key="key"
    class="model-property"
  >
    <template v-if="isValidSchemaObject(property)">
      <div class="property-info">
        <code>{{ key }}</code>
        <span class="property-type">
          {{ property.type ?? '' }}
          {{ isValidSchemaObject(property.items) && property.items.type ? `[${property.items.type}]` : '' }}
          {{ property.format ? `(${property.format})` : '' }}
        </span>
        <span
          v-if="requiredFields?.includes(key.toString())"
          class="required-property"
        >
          required
        </span>
      </div>
      <p v-if="property.description">
        {{ property.description }}
      </p>
      <p v-if="property.example">
        <span>Example: </span> {{ property.example }}
      </p>
      <p v-if="property.enum">
        Allowed values: {{ property.enum }}
      </p>

      <template v-if="isValidSchemaObject(property.items)">
        <p v-if="property.items.type === 'string' && (property.items.enum || property.items.pattern)">
          <span v-if="property.items.enum">Allowed values: {{ property.items.enum }}</span>
          <span v-else-if="property.items.pattern">Allowed pattern: <code>{{ property.items.pattern }}</code></span>
        </p>
        <p v-else-if="property.items.type === 'integer' && (property.items.maximum || property.items.minimum)">
          <span v-if="property.items.maximum">Max: {{ property.items.maximum }}</span>
          <span v-if="property.items.maximum && property.items.minimum">|</span>
          <span v-if="property.items.minimum"> Min: {{ property.items.minimum }}</span>
        </p>
        <details v-else-if="isNestedObj(property.items)">
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

.property-info>:not(:first-child) {
  margin-left: var(--kui-space-40, $kui-space-40);
}

.property-type {
  color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
}

.required-property {
  color: var(--kui-color-text-danger, $kui-color-text-danger);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
}
</style>
