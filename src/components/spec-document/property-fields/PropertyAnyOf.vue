<template>
  <div data-testid="property-field-any-of">
    <div>anyOf: </div>
    <ModelProperty
      v-for="(anyOfObject, index) in filteredAnyOfList"
      :key="index"
      :property="anyOfObject"
      :property-name="inheritedPropertyName(index, anyOfObject.title)"
      :required-fields="anyOfObject.required"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'
import ModelProperty from '../ModelProperty.vue'
import { inheritedPropertyName, filterSchemaObjectArray } from '@/utils'

const props = defineProps({
  anyOfList: {
    type: Array as PropType<SchemaObject['anyOf']>,
    required: true,
  },
})

const filteredAnyOfList = computed(() => filterSchemaObjectArray(props.anyOfList))
</script>
