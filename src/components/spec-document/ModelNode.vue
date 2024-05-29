<template>
  <div :data-testid="dataTestId">
    <h3>
      {{ title }} <code v-if="data.type">{{ data.type }}</code>
    </h3>
    <p v-if="data.description">
      {{ data.description }}
    </p>
    <p v-if="data.examples">
      Example: {{ data.examples }}
    </p>
    <p v-if="data.enum">
      <span>Allowed values: </span> {{ data.enum }}
    </p>

    <template v-if="modelPropertyProps">
      <template
        v-for="(property, propertyName) in modelPropertyProps.properties"
        :key="propertyName"
      >
        <ModelProperty
          v-if="isValidSchemaObject(property)"
          :data-testid="`model-property-${propertyName}`"
          :property="property"
          :property-name="propertyName.toString()"
          :required-fields="modelPropertyProps.required"
        />
      </template>
      <PropertyOneOf
        v-if="Array.isArray(modelPropertyProps.oneOf) && modelPropertyProps.oneOf?.length"
        :one-of-list="modelPropertyProps.oneOf"
      />

      <PropertyAnyOf
        v-if="Array.isArray(modelPropertyProps.anyOf) && modelPropertyProps.anyOf?.length"
        :any-of-list="modelPropertyProps.anyOf"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type{ PropType } from 'vue'
import type { SchemaObject } from '@/types'
import { isValidSchemaObject, resolveSchemaObjectFields } from '@/utils'
import ModelProperty from './ModelProperty.vue'
import PropertyAnyOf from './property-fields/PropertyAnyOf.vue'
import PropertyOneOf from './property-fields/PropertyOneOf.vue'

const props = defineProps({
  data: {
    type: Object as PropType<SchemaObject>,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
})

const modelPropertyProps = computed(() => resolveSchemaObjectFields(props.data))
const dataTestId = computed(() => `model-node-${props.title.replaceAll(' ', '-')}`)
</script>
