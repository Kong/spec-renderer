<template>
  <div
    v-for="(property, key) in properties"
    :key="key"
    class="model-property"
  >
    <template v-if="property && isSchemaObject(property)">
      <div
        class="property-info"
      >
        <code>{{ key }}</code>
        <span
          class="property-type"
        >
          {{ property.type ?? '' }}
          {{ property.items && isSchemaObject(property.items) && property.items.type ? `[${property.items.type}]` : '' }}
          {{ property.format ? `(${property.format})` : '' }}
        </span>
        <span
          v-if="required?.includes(key.toString())"
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

      <template v-if="property.items && isSchemaObject(property.items)">
        <p v-if="property.items.type === 'string'">
          <span v-if=" property.items.enum">Allowed values: {{ property.items.enum }}</span>
          <span v-else-if="property.items.pattern">Allowed pattern: <code>{{ property.items.pattern }}</code></span>
        </p>
        <p v-else-if="property.items.type === 'integer'">
          Max: {{ property.items.maximum || '' }} | Min: {{ property.items.minimum || '' }}
        </p>
        <p
          v-else-if="property.items.type === 'object'"
          style="color: red; font-size: 64px;"
        >
          {{ property.items }}
        </p>
      </template>

      <details v-if="isNestedObj(property)">
        <summary>Properties of <code>{{ key }}</code></summary>
        <ModelProperties
          :properties="property.properties"
          :required="property.required"
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

import { isSchemaObject } from 'openapi3-ts/oas31'
import type { SchemaObject } from 'openapi3-ts/oas31'

defineProps({
  properties: {
    type: Object as PropType<SchemaObject['properties']>,
    required: true,
  },
  required: {
    type: Array as PropType<SchemaObject['required']>,
    default: () => [],
  },
})

const isNestedObj = (property: SchemaObject) => property.type === 'object' && property.properties && Reflect.ownKeys(property.properties).length
</script>

<style lang="scss" scoped>

.model-property {
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  padding: $kui-space-50 0;

  &>:not(:first-child) {
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}

.property-info>:not(:first-child) {
  margin-left: var(--kui-space-40, $kui-space-40);
}

.property-type {
  color: $kui-color-text-neutral-strong;
  font-size: $kui-font-size-20;
}

.required-property {
  color: $kui-color-text-danger;
  font-size: $kui-font-size-20;
}
</style>
