<template>
  <component
    :is="nestedPropertiesPresent ? 'details' : 'div'"
    class="model-property"
    :data-testid="dataTestId"
    @toggle="() => nestedPropertiesExpanded = !nestedPropertiesExpanded"
  >
    <component
      :is="nestedPropertiesPresent ? 'summary' : 'div'"
      class="model-property-fields"
    >
      <component
        :is="field.component"
        v-for="field in orderedFieldList"
        :key="field.key"
        v-bind="field.props"
      />
    </component>

    <ModelNode
      v-if="resolvedModelProperty && nestedPropertiesExpanded"
      class="model-property-nested-fields"
      :schema="resolvedModelProperty"
      :title="propertyName"
    />
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { isValidSchemaObject, resolveSchemaObjectFields } from '@/utils'
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'

import ModelNode from './ModelNode.vue'
import PropertyDescription from './property-fields/PropertyDescription.vue'
import PropertyExample from './property-fields/PropertyExample.vue'
import PropertyInfo from './property-fields/PropertyInfo.vue'
import PropertyEnum from './property-fields/PropertyEnum.vue'
import PropertyPattern from './property-fields/PropertyPattern.vue'
import PropertyRange from './property-fields/PropertyRange.vue'

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

const dataTestId = computed(() => `model-property-${props.propertyName.replaceAll(' ', '-')}`)

const nestedPropertiesPresent = computed<boolean>(() =>{
  if (resolvedModelProperty.value?.properties) {
    return Boolean(Object.keys(resolvedModelProperty.value?.properties).length)
  }
  return Boolean(resolvedModelProperty.value?.anyOf?.length) || Boolean(resolvedModelProperty.value?.oneOf?.length)
})

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
        collapsableProperty: nestedPropertiesPresent.value,
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


</script>

<style lang="scss" scoped>
.model-property {
  // reset margins for nested fields
  * {
    margin: var(--kui-space-0, $kui-space-0);
  }

  > :not(:first-child) {
    margin-top: var(--kui-space-20, $kui-space-20);
  }

  .model-property-fields {
    padding: var(--kui-space-40, $kui-space-40);
    padding-left: var(--kui-space-0, $kui-space-0);
  }

  summary.model-property-fields {
    cursor: pointer;
    list-style: none;
  }

  .model-property-nested-fields {
    @include tree-nesting;

    // only nested fields should have a left padding
    padding-left: var(--kui-space-70, $kui-space-70);
  }

}
</style>
