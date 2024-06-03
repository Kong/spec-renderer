<template>
  <component
    :is="resolvedModelProperty?.properties ? 'details' : 'div'"
    class="model-property"
    :data-testid="dataTestId"
    @toggle="() => nestedPropertiesExpanded = !nestedPropertiesExpanded"
  >
    <component
      :is="resolvedModelProperty?.properties ? 'summary' : 'div'"
      class="model-property-fields"
    >
      <component
        :is="field.component"
        v-for="field in orderedFieldList"
        :key="field.key"
        v-bind="field.props"
      />
    </component>

    <template v-if="resolvedModelProperty">
      <div
        v-if="resolvedModelProperty.properties"
        class="model-property-nested-fields"
      >
        <template
          v-for="(subProperty, subPropertyName) in resolvedModelProperty.properties"
          :key="subPropertyName"
        >
          <ModelProperty
            v-if="isValidSchemaObject(subProperty)"
            :property="subProperty"
            :property-name="subPropertyName.toString()"
            :required-fields="resolvedModelProperty.required"
          />
        </template>
      </div>
      <PropertyOneOf
        v-if="Array.isArray(resolvedModelProperty.oneOf) && resolvedModelProperty.oneOf?.length"
        :one-of-list="resolvedModelProperty.oneOf"
      />
      <PropertyAnyOf
        v-if="Array.isArray(resolvedModelProperty.anyOf) && resolvedModelProperty.anyOf?.length"
        :any-of-list="resolvedModelProperty.anyOf"
      />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { isValidSchemaObject, resolveSchemaObjectFields } from '@/utils'
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'

import PropertyDescription from './property-fields/PropertyDescription.vue'
import PropertyExample from './property-fields/PropertyExample.vue'
import PropertyInfo from './property-fields/PropertyInfo.vue'
import PropertyEnum from './property-fields/PropertyEnum.vue'
import PropertyPattern from './property-fields/PropertyPattern.vue'
import PropertyRange from './property-fields/PropertyRange.vue'
import PropertyOneOf from './property-fields/PropertyOneOf.vue'
import PropertyAnyOf from './property-fields/PropertyAnyOf.vue'

const props = defineProps({
  property: {
    type: Object as PropType<SchemaObject>,
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
const nestedPropertiesExpanded = ref(false)

const resolvedModelProperty = computed(() => resolveSchemaObjectFields(props.property))

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
        propertyItemType:
            isValidSchemaObject(props.property.items) && props.property.items.type
              ? props.property.items.type
              : '',
        requiredFields: props.requiredFields,
        collapsableProperty: Boolean(resolvedModelProperty.value?.properties),
        itemsExpanded: nestedPropertiesExpanded.value,
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
        enumValueList: props.property.enum,
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
  if (props.property.examples) {
    fields.push({
      component: PropertyExample,
      props: {
        example: props.property.examples,
      },
      key: 'property-example',
    })
  }
  return fields
})

const dataTestId = computed(() => `model-property-${props.propertyName.replaceAll(' ', '-')}`)
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/tree';

.model-property {
  padding: var(--kui-space-40, $kui-space-40);

  // reset margins for nested fields
  > * {
    margin: var(--kui-space-0, $kui-space-0);
  }
  .model-property-fields {
    > * {
    margin: var(--kui-space-0, $kui-space-0);
    }
  }

  summary.model-property-fields {
    cursor: pointer;
    list-style: none;
  }

  > :not(:first-child) {
    margin-top: var(--kui-space-20, $kui-space-20);
  }

  .model-property-nested-fields {
    @include tree-nesting
  }

}
</style>
