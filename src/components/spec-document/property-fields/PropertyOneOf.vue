<template>
  <div data-testid="property-field-one-of">
    <div>One of</div>
    <template
      v-for="(oneOfObject, index) in filteredOneOfList"
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
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { SchemaObject, ReferenceObject } from '@/types'
import ModelProperty from '../ModelProperty.vue'
import { isValidSchemaObject, inheritedPropertyName } from '@/utils'

const props = defineProps({
  oneOfList: {
    type: Array as PropType<Array<SchemaObject | ReferenceObject>>,
    required: true,
  },
})

const filteredOneOfList = computed(() => props.oneOfList.filter(item => Boolean(item)))
</script>
