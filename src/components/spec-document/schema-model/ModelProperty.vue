<template>
  <div
    class="model-property"
    :data-testid="dataTestId"
  >
    <component
      :is="field.component"
      v-for="field in orderedFieldList"
      :key="field.key"
      v-bind="field.props"
    />

    <details
      v-if="nestedPropertiesPresent"
    >
      <summary
        class="nested-fields-summary"
        @click="() => nestedPropertiesExpanded = !nestedPropertiesExpanded"
      >
        <AddCircleIcon
          class="add-circle-icon"
          :class="{ 'expanded': nestedPropertiesExpanded }"
        />
        <span>{{ nestedPropertiesExpanded ? 'Hide' : 'Show' }} Child Parameters</span>
      </summary>
      <ModelNode
        v-if="resolvedModelProperty && nestedPropertiesExpanded"
        class="nested-model-node"
        :schema="resolvedModelProperty"
        :title="propertyName"
      />
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AddCircleIcon } from '@kong/icons'
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
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-50, $kui-space-50);
  padding: var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0);

  // reset margins for nested fields
  * {
    margin: var(--kui-space-0, $kui-space-0);
  }

  .nested-fields-summary {
    align-items: center;
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    cursor: pointer;
    display: flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    gap: var(--kui-space-30, $kui-space-30);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
    padding: var(--kui-space-50, $kui-space-50) var(--kui-space-40, $kui-space-40);

    .add-circle-icon {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral) !important;
      flex-shrink: 0;
      height: var(--kui-icon-size-40, $kui-icon-size-40) !important;
      pointer-events: none;
      transition: transform var(--kui-animation-duration-20, $kui-animation-duration-20) ease;
      width: var(--kui-icon-size-40, $kui-icon-size-40) !important;

      &.expanded {
        transform: rotate(45deg);
      }
    }
  }

  .nested-model-node {
    @include tree-nesting;

    // left padding for the nested model-node tree
    padding-left: var(--kui-space-40, $kui-space-40);

    .model-property {
      // left padding for space between the tree-branch and model-property
      padding-left: var(--kui-space-40, $kui-space-40);
    }
  }

}
</style>
