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

  <ModelProperties
    v-if="modelPropertiesProps"
    :properties="modelPropertiesProps.properties"
    :required-fields="modelPropertiesProps.required"
  />
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import ModelProperties from './ModelProperties.vue'

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
  const { data: { value: { type, properties, items, required } } } = toRefs(props)
  let computedObj: Partial<SchemaObject> | null = null

  if (type === 'object' && properties && Reflect.ownKeys(properties).length) {
    computedObj = { properties, required }
  } else if (type === 'array' && isValidSchemaObject(items)) {
    computedObj = { properties: items.properties, required: items.required }
  }

  return computedObj
})
</script>
