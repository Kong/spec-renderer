<template>
  <div data-testid="property-field-any-of">
    <div>anyOf: </div>
    <template
      v-for="(anyOfObject, index) in anyOfList"
      :key="index"
    >
      <ModelProperty
        v-if="isValidSchemaObject(anyOfObject)"
        :property="anyOfObject"
        :property-name="inheritedPropertyName(index, anyOfObject.title)"
        :required-fields="anyOfObject.required"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { ReferenceObject, SchemaObject } from '@/types'
import ModelProperty from '../ModelProperty.vue'
import { isValidSchemaObject, inheritedPropertyName } from '@/utils'

defineProps({
  anyOfList: {
    type: Array as PropType<Array<SchemaObject | ReferenceObject>>,
    required: true,
  },
})
</script>
