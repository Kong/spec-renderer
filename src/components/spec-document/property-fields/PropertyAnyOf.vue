<template>
  <div data-testid="property-field-any-of">
    <div>anyOf: </div>
    <template
      v-for="(anyOfObject, index) in filteredAnyOfList"
      :key="index"
    >
      <ModelProperty
        v-if="isModelPropertyVisible(anyOfObject, readonlyVisible)"
        :property="anyOfObject"
        :property-name="inheritedPropertyName(index, anyOfObject.title)"
        :readonly-visible="readonlyVisible"
        :required-fields="anyOfObject.required"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'
import ModelProperty from '../ModelProperty.vue'
import { inheritedPropertyName, filterSchemaObjectArray, isModelPropertyVisible } from '@/utils'

const props = defineProps({
  anyOfList: {
    type: Array as PropType<SchemaObject['anyOf']>,
    required: true,
  },
  readonlyVisible: {
    type: Boolean,
    default: true,
  },
})

const filteredAnyOfList = computed(() => filterSchemaObjectArray(props.anyOfList))
</script>
