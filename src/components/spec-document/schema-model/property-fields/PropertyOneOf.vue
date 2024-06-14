<template>
  <div data-testid="property-field-one-of">
    <div>One of</div>
    <ModelProperty
      v-for="(oneOfObject, index) in filteredOneOfList"
      :key="oneOfObject.title || index"
      :property="oneOfObject"
      :property-name="inheritedPropertyName(index, oneOfObject.title)"
      :required-fields="oneOfObject.required"
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
  oneOfList: {
    type: Array as PropType<SchemaObject['oneOf']>,
    required: true,
  },
})

const filteredOneOfList = computed(() => filterSchemaObjectArray(props.oneOfList))
</script>
