<template>
  <h3>
    {{ title }} <code v-if="data.type">{{ data.type }}</code>
  </h3>
  <p v-if="data.description">
    {{ data.description }}
  </p>
  <p v-if="data.example || data.examples">
    Example: {{ data.example || data.examples }}
  </p>
  <p v-if="data.enum">
    <span>Allowed values: </span> {{ data.enum }}
  </p>

  <template v-if="modelPropertiesProps">
    <ModelProperty
      v-for="(property, propertyName) in modelPropertiesProps.properties"
      :key="propertyName"
      :data-testid="`model-property-${propertyName}`"
      :property="property"
      :property-name="propertyName.toString()"
      :required-fields="modelPropertiesProps.required"
    />
  </template>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import ModelProperty from './ModelProperty.vue'

import { isValidSchemaObject } from '@/utils'

import type{ PropType } from 'vue'
import type { SchemaObject } from '@/types'

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

const modelPropertiesProps = computed(() => {
  const { data } = toRefs(props)
  let computedObj: Partial<SchemaObject> | null = null

  /**
   * We have to enumerate over the properties of the Schema Model and render them out via `ModelProperty` component.
   * For this, we need to compute the properties and required fields of the Schema Model.
   * If the top level Schema Model is an object, we can directly use the `properties` field of the object.
   * If it's an array, we need to derive the properties from the `items` field of the Schema Model.
   */
  if (data.value.type === 'object' && data.value.properties && Reflect.ownKeys(data.value.properties).length) {
    computedObj = { properties: data.value.properties, required: data.value.required }
  } else if (data.value.type === 'array' && isValidSchemaObject(data.value.items)) {
    computedObj = { properties: data.value.items.properties, required: data.value.items.required }
  }

  return computedObj
})
</script>
