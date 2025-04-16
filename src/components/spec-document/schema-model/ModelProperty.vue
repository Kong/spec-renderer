<template>
  <div
    :id="propertyId"
    ref="model-property"
    class="model-property"
    :data-testid="dataTestId"
  >
    <PropertyFieldList
      :inheritance-type-label="inheritanceTypeLabel"
      :property="resolvedSchemaObject"
      :property-name="propertyName"
      :property-path="propertyId"
      :required-fields="requiredFields"
      :variant-select-item-list="variantSelectItemList"
      @variant-changed="(index: number) => selectedVariantIndex = index"
    />

    <div
      v-if="variantSelectItemList.length"
      class="selected-variant-container"
    >
      <ModelProperty
        :base-path-id="propertyId"
        :depth="depth"
        :property="selectedSchemaModel"
        :property-name="selectedSchemaModel.title || variantSelectItemList[selectedVariantIndex].label"
        :required-fields="selectedSchemaModel.required"
      />
    </div>

    <details
      v-else-if="nestedPropertiesPresent"
      ref="nested-fields"
    >
      <summary
        class="nested-fields-summary"
        @click="() => nestedPropertiesExpanded = !nestedPropertiesExpanded"
      >
        <AddIcon
          class="add-circle-icon"
          :class="{ 'expanded': nestedPropertiesExpanded }"
          size="16px"
        />
        <span>{{ nestedPropertiesExpanded ? 'Hide' : 'Show' }} Child Parameters</span>
      </summary>
      <ModelNode
        v-if="nestedPropertiesExpanded"
        :base-path-id="propertyId"
        class="nested-model-node"
        :depth="depth + 1"
        :schema="selectedSchemaModel"
        :title="propertyName"
      />
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, useTemplateRef } from 'vue'
import { AddIcon } from '@kong/icons'
import { isSsr, kebabCase, resolveSchemaObjectFields } from '@/utils'
import type { PropType, Ref } from 'vue'
import type { SchemaObject } from '@/types'

import ModelNode from './ModelNode.vue'
import useSchemaVariants from '@/composables/useSchemaVariants'
import PropertyFieldList from './PropertyFieldList.vue'
import { DEFAULT_EXPANDED_PROPERTIES_DEPTH } from '@/constants'

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
  /**
   * used for links to individual properties of a Schema Model
   */
  basePathId: {
    type: String,
    default: '',
  },
  /**
   * The depth at which the current property is at
   */
  depth: {
    type: Number,
    default: 1,
  },
})

const maxExpandedDepth = inject<Ref<number>>('max-expanded-depth', ref(DEFAULT_EXPANDED_PROPERTIES_DEPTH))

const nestedPropertiesExpanded = ref(props.depth < maxExpandedDepth.value)

const currentElement = useTemplateRef('model-property')
const nestedFieldsDetails = useTemplateRef('nested-fields')

const dataTestId = computed(() => `model-property-${kebabCase(props.propertyName)}`)
const propertyId = computed(() => props.basePathId ? kebabCase(`${props.basePathId}-${props.propertyName}`) : undefined)

const resolvedSchemaObject = computed(() => resolveSchemaObjectFields(props.property))
const {
  variantSelectItemList,
  selectedSchemaModel,
  selectedVariantIndex,
  inheritanceTypeLabel,
} = useSchemaVariants(resolvedSchemaObject)

const nestedPropertiesPresent = computed<boolean>(() =>{
  if (selectedSchemaModel.value?.properties) {
    return Boolean(Object.keys(selectedSchemaModel.value?.properties).length)
  }
  return false
})

onMounted(() => {
  if (nestedPropertiesExpanded.value) {
    openDetailsElement()
  }

  // don't do anything if either:
  // 1. we are in ssr mode
  // 2. the propertyId is not defined i.e. `enablePropertyLinks` is not enabled
  if (isSsr() || !propertyId.value) {
    return
  }
  const propertyIDHash = `#${propertyId.value}`
  const hash = window.location.hash
  if (hash.length) {
    // if the hash is the same as the current component's propertyId it means we want to show the current component
    // so we scroll to the current component
    if (hash === propertyIDHash) {
      currentElement.value?.scrollIntoView({ behavior: 'smooth' })
    } else if (hash.startsWith(propertyIDHash)) {
      nestedPropertiesExpanded.value = true
      // only mess with the details element during mounted
      // after that let the details element handle it itself
      openDetailsElement()
    }
  }
})

const openDetailsElement = () => {
  if (nestedFieldsDetails.value) {
    nestedFieldsDetails.value.open = true
  }
}
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
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    gap: var(--kui-space-30, $kui-space-30);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    padding: var(--kui-space-20, $kui-space-20);
    padding-right: var(--kui-space-30, $kui-space-30);
    width: max-content;

    .add-circle-icon {
      @include toggle-icon(
        $textColor: var(--kui-color-text-neutral, $kui-color-text-neutral),
        $height: var(--kui-icon-size-30, $kui-icon-size-30),
        $width: var(--kui-icon-size-30, $kui-icon-size-30),
        $rotateDegree: 45deg,
      );
    }
  }

  .selected-variant-container {
    @include tree-nesting;

    .model-property {
      // left padding for space between the tree-branch and model-property
      padding-left: var(--kui-space-40, $kui-space-40);
    }
  }

  .nested-model-node {
    @include tree-nesting;

    // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
    // stylelint-disable-next-line no-duplicate-selectors
    & {
      // left padding for the nested model-node tree
      padding-left: var(--kui-space-40, $kui-space-40);
    }

    .model-property {
      // left padding for space between the tree-branch and model-property
      padding-left: var(--kui-space-40, $kui-space-40);
    }
  }

}
</style>
