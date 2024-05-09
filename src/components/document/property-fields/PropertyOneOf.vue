<template>
  <div data-testid="property-field-one-of">
    <div>One of</div>
    <template
      v-for="(oneOfObject, index) in oneOfList"
      :key="oneOfObject.title || index"
    >
      <ModelProperty
        v-if="isValidSchemaObject(oneOfObject)"
        :property="oneOfObject"
        :property-name="inheritedPropertyName(index, oneOfObject.title)"
        :required-fields="oneOfObject.required"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { SchemaObject, ReferenceObject } from '@/types'
import ModelProperty from '../ModelProperty.vue'
import { isValidSchemaObject, inheritedPropertyName } from '@/utils'

defineProps({
  oneOfList: {
    type: Array as PropType<Array<SchemaObject | ReferenceObject>>,
    required: true,
  },
})
</script>
