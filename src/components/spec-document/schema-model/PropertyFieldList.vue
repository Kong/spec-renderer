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
import { RangeFields } from '@/types'

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
    type: Array as PropType<SchemaModelPropertyField[]>,
    default: () => [],
  },
  requiredFields: {
    type: Array as PropType<SchemaObject['required']>,
    default: () => [],
  },
  variantSelectItemList: {
    type: Array as PropType<SelectItem[]>,
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

const showProperty = (field: SchemaModelPropertyField) => {
  if (props.hiddenFieldList.includes(field)) {
    return false
  }

  const explictlyDefinedFields = props.property?.['x-stoplight']?.explicitProperties

  if (Array.isArray(explictlyDefinedFields) && explictlyDefinedFields.length) {
    // show the field only if it was explicitly defined
    return explictlyDefinedFields.includes(field)
  }

  return true
}


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
        propertyItemType: props.property.itemType,
        format: props.property.format,
        readOnly: props.property.readOnly,
      },
      eventHandlers: {
        'variant-changed': (index: number) => {
          emit('variant-changed', index)
        },
      },
      key: 'property-info',
    })
  }
  if (showProperty('description') && props.property.description) {
    fields.push({
      component: PropertyDescription,
      props: {
        description: props.property.description,
      },
      eventHandlers:{},
      key: 'property-description',
    })
  }
  if (showProperty('enum') && props.property.enum) {
    fields.push({
      component: PropertyEnum,
      props: {
        enumValueList: props.property.enum,
      },
      eventHandlers:{},
      key: 'property-enum',
    })
  }
  if (showProperty('pattern') && props.property.pattern) {
    fields.push({
      component: PropertyPattern,
      props: {
        pattern: props.property.pattern,
      },
      eventHandlers:{},
      key: 'property-pattern',
    })
  }

  if (showProperty('default') && props.property.default !== undefined) {
    fields.push({
      component: PropertyDefault,
      props: {
        defaultValue: props.property.default,
      },
      eventHandlers:{},
      key: 'property-default',
    })
  }

  const rangeProps: Partial<Pick<SchemaObject, typeof RangeFields[number]>> = {}

  RangeFields.forEach(field => {
    if (showProperty(field)) {
      rangeProps[field] = props.property[field]
    }
  })

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

  const showExamples = (props.property.example && showProperty('example')) || (props.property.examples && showProperty('examples'))

  if (showExamples) {
    fields.push({
      component: PropertyExample,
      props: {
        example: props.property.examples || props.property.example,
      },
      eventHandlers:{},
      key: 'property-example',
    })
  }

  if (showProperty('additionalProperties') && typeof props.property.additionalProperties === 'boolean') {
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
