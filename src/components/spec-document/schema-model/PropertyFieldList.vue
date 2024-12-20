<template>
  <div class="property-field-list">
    <component
      :is="field.component"
      v-for="field in orderedFieldList"
      :key="field.key"
      v-bind="field.props"
      v-on="field.eventHandlers"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import { isValidSchemaObject } from '@/utils'
import type { SchemaModelPropertyField, SchemaObject, SelectItem } from '@/types'

import PropertyDescription from './property-fields/PropertyDescription.vue'
import PropertyExample from './property-fields/PropertyExample.vue'
import PropertyInfo from './property-fields/PropertyInfo.vue'
import PropertyEnum from './property-fields/PropertyEnum.vue'
import PropertyPattern from './property-fields/PropertyPattern.vue'
import PropertyRange from './property-fields/PropertyRange.vue'
import PropertyDefault from './property-fields/PropertyDefault.vue'
import AdditionalProperties from './property-fields/AdditionalProperties.vue'

const props = defineProps({
  property: {
    type: Object as PropType<SchemaObject>,
    required: true,
  },
  propertyName: {
    type: String,
    default: '',
  },
  hiddenFieldList: {
    type: Array as PropType<Array<SchemaModelPropertyField>>,
    default: () => [],
  },
  requiredFields: {
    type: Array as PropType<SchemaObject['required']>,
    default: () => [],
  },
  variantSelectItemList: {
    type: Array as PropType<Array<SelectItem>>,
    default: () => [],
  },
  inheritanceTypeLabel: {
    type: String,
    default: '',
  },
  propertyPath: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'variant-changed', variant: number): void
}>()

const orderedFieldList = computed(() => {
  const fields = []

  if (!isValidSchemaObject(props.property)) return []

  if (!props.hiddenFieldList.includes('info') && (props.property.title || props.propertyName || props.property.type)) {
    fields.push({
      component: PropertyInfo,
      props: {
        title: props.propertyName || props.property.title,
        propertyType: props.property.type,
        uniqueItems: props.property.uniqueItems,
        requiredFields: props.requiredFields,
        variantsList: props.variantSelectItemList,
        inheritanceTypeLabel: props.inheritanceTypeLabel,
        deprecated: props.property.deprecated,
        propertyPath: props.propertyPath,
        // if property is of array type, we use format to display the item type, else we use format as it is
        ...(props.property.type === 'array' ? { propertyItemType: props.property.format } : { format: props.property.format }),
      },
      eventHandlers: {
        'variant-changed': (index: number) => {
          emit('variant-changed', index)
        },
      },
      key: 'property-info',
    })
  }
  if (!props.hiddenFieldList.includes('description') && props.property.description) {
    fields.push({
      component: PropertyDescription,
      props: {
        description: props.property.description,
      },
      eventHandlers:{},
      key: 'property-description',
    })
  }
  if (!props.hiddenFieldList.includes('enum') && props.property.enum) {
    fields.push({
      component: PropertyEnum,
      props: {
        enumValueList: props.property.enum,
      },
      eventHandlers:{},
      key: 'property-enum',
    })
  }
  if (!props.hiddenFieldList.includes('pattern') && props.property.pattern) {
    fields.push({
      component: PropertyPattern,
      props: {
        pattern: props.property.pattern,
      },
      eventHandlers:{},
      key: 'property-pattern',
    })
  }

  if (!props.hiddenFieldList.includes('default') && props.property.default !== undefined) {
    fields.push({
      component: PropertyDefault,
      props: {
        defaultValue: props.property.default,
      },
      eventHandlers:{},
      key: 'property-default',
    })
  }

  const rangeProps = {
    max: props.property.maximum,
    min: props.property.minimum,
    maxLength: props.property.maxLength,
    minLength: props.property.minLength,
    exclusiveMaximum: props.property.exclusiveMaximum,
    exclusiveMinimum: props.property.exclusiveMinimum,
    multipleOf: props.property.multipleOf,
    maxItems: props.property.maxItems,
    minItems: props.property.minItems,
  }

  if (
    !props.hiddenFieldList.includes('range') &&
    Object.values(rangeProps).some(value => value !== undefined)
  ) {
    fields.push({
      component: PropertyRange,
      props: rangeProps,
      eventHandlers: {},
      key: 'property-range',
    })
  }


  if (!props.hiddenFieldList.includes('example') && (props.property.examples || props.property.example)) {
    fields.push({
      component: PropertyExample,
      props: {
        example: props.property.examples || props.property.example,
      },
      eventHandlers:{},
      key: 'property-example',
    })
  }

  if (!props.hiddenFieldList.includes('additional-properties') && typeof props.property.additionalProperties === 'boolean') {
    fields.push({
      component: AdditionalProperties,
      props: {
        additionalProperties: props.property.additionalProperties,
      },
      eventHandlers:{},
      key: 'property-additional-properties',
    })
  }

  return fields
})
</script>

<style lang="scss" scoped>
.property-field-list {
  overflow-wrap: anywhere;
  > :not(:first-child) {
    margin-top: var(--kui-space-50, $kui-space-50);
  }
}
</style>
