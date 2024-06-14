<template>
  <div
    :data-testid="dataTestId"
  >
    <template
      v-for="(property, propertyName) in resolvedSchemaObject?.properties"
      :key="propertyName"
    >
      <ModelProperty
        v-if="isValidSchemaObject(property)"
        :data-testid="`model-property-${propertyName}`"
        :property="property"
        :property-name="propertyName.toString()"
        :required-fields="resolvedSchemaObject?.required"
      />
    </template>

    <PropertyOneOf
      v-if="Array.isArray(resolvedSchemaObject?.oneOf) && resolvedSchemaObject?.oneOf?.length"
      :one-of-list="resolvedSchemaObject?.oneOf"
    />

    <PropertyAnyOf
      v-if="Array.isArray(resolvedSchemaObject?.anyOf) && resolvedSchemaObject?.anyOf?.length"
      :any-of-list="resolvedSchemaObject?.anyOf"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'
import { isValidSchemaObject, resolveSchemaObjectFields } from '@/utils'
import ModelProperty from './ModelProperty.vue'
import PropertyAnyOf from './property-fields/PropertyAnyOf.vue'
import PropertyOneOf from './property-fields/PropertyOneOf.vue'

const props = defineProps({
  schema: {
    type: Object as PropType<SchemaObject>,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
})

const resolvedSchemaObject = computed(() => resolveSchemaObjectFields(props.schema))
const dataTestId = computed(() => `model-node-${props.title.replaceAll(' ', '-')}`)
</script>
