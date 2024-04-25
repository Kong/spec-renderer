<template>
  <h3>
    {{ title }} <code v-if="data.type">{{ data.type }}</code>
  </h3>
  <p v-if="data.description">
    {{ data.description }}
  </p>
  <p v-if="data.examples">
    {{ data.examples }}
  </p>
  <p v-if="data.enum">
    <span>Allowed values: </span> {{ data.enum }}
  </p>

  <div v-if="data.properties">
    <ModelProperties
      :properties="data.properties"
      :required="data.required"
    />
  </div>
</template>

<script setup lang="ts">
import ModelProperties from './ModelProperties.vue'

import type { PropType } from 'vue'
import type { JSONSchema7 } from 'json-schema'

// TODO: type def is missing for model need to add
defineProps({
  data: {
    type: Object as PropType<JSONSchema7>,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
})
</script>
