<template>
  <div
    class="model-property"
    :data-testid="`model-property-${propertyName}`"
  >
    <template v-if="isValidSchemaObject(property)">
      <component
        :is="field.component"
        v-for="field in orderedFieldList"
        :key="field.key"
        v-bind="field.props"
      />

      <details v-if="modelPropertyProps?.properties">
        <summary>Properties of <code>{{ propertyName }}</code></summary>
        <ModelProperty
          v-for="(subProperty, subPropertyName) in modelPropertyProps.properties"
          :key="subPropertyName"
          :property="subProperty"
          :property-name="subPropertyName.toString()"
          :required-fields="modelPropertyProps.required"
        />
      </details>

      <PropertyOneOf
        v-if="Array.isArray(property.oneOf) && property.oneOf?.length"
        :one-of-list="property.oneOf"
      />

      <PropertyAnyOf
        v-if="Array.isArray(property.anyOf) && property.anyOf?.length"
        :any-of-list="property.anyOf"
      />
    </template>

    <div v-else>
      <code>{{ propertyName }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { isValidSchemaObject, schemaObjectProperties } from '@/utils'
import type { ReferenceObject, SchemaObject } from '@/types'

import PropertyDescription from '@/components/document/property-fields/PropertyDescription.vue'
import PropertyExample from '@/components/document/property-fields/PropertyExample.vue'
import PropertyInfo from '@/components/document/property-fields/PropertyInfo.vue'
import PropertyEnum from '@/components/document/property-fields/PropertyEnum.vue'
import PropertyPattern from '@/components/document/property-fields/PropertyPattern.vue'
import PropertyRange from '@/components/document/property-fields/PropertyRange.vue'
import PropertyOneOf from '@/components/document/property-fields/PropertyOneOf.vue'
import PropertyAnyOf from '@/components/document/property-fields/PropertyAnyOf.vue'

const props = defineProps({
  property: {
    type: Object as PropType<SchemaObject | ReferenceObject>,
    required: true,
  },
  propertyName: {
    type: String,
    required: true,
  },
  requiredFields: {
    type: Array as PropType<SchemaObject['required']>,
    default: () => [],
  },
})

const modelPropertyProps = computed(() => isValidSchemaObject(props.property) ? schemaObjectProperties(props.property) : null)

const orderedFieldList = computed(() => {
  const fields = []

  if (!isValidSchemaObject(props.property)) return []

  if (props.property.title || props.propertyName) {
    fields.push({
      component: PropertyInfo,
      props: {
        title: props.propertyName || props.property.title,
        propertyType: props.property.type,
        format: props.property.format,
        propertyItemtype:
            isValidSchemaObject(props.property.items) && props.property.items.type
              ? props.property.items.type
              : '',
        requiredFields: props.requiredFields,
      },
      key: 'property-info',
    })
  }
  if (props.property.description) {
    fields.push({
      component: PropertyDescription,
      props: {
        description: props.property.description,
      },
      key: 'property-description',
    })
  }
  if (props.property.enum) {
    fields.push({
      component: PropertyEnum,
      props: {
        enumValue: props.property.enum,
      },
      key: 'property-enum',
    })
  }
  if (props.property.pattern) {
    fields.push({
      component: PropertyPattern,
      props: {
        pattern: props.property.pattern,
      },
      key: 'property-pattern',
    })
  }
  if (props.property.maximum || props.property.minimum) {
    fields.push({
      component: PropertyRange,
      props: {
        max: props.property.maximum,
        min: props.property.minimum,
      },
      key: 'property-range',
    })
  }
  if (props.property.example || props.property.examples) {
    fields.push({
      component: PropertyExample,
      props: {
        example: props.property.example || props.property.examples,
      },
      key: 'property-example',
    })
  }
  return fields
})
</script>

<style lang="scss" scoped>
.model-property {
  border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  padding: var(--kui-space-50, $kui-space-50) var(--kui-space-80, $kui-space-80);

  &> :not(:first-child) {
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}
</style>
