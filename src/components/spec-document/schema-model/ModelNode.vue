<template>
  <div
    class="model-node-container"
    :data-testid="dataTestId"
  >
    <SelectDropdown
      v-if="variantSelectItemList.length"
      :id="`${dataTestId}-variant-select-dropdown`"
      v-model="selectedVariantOption"
      class="model-node-variant-select"
      :items="variantSelectItemList"
      @change="handleVariantSelectChange"
    />
    <ModelProperty
      v-if="selectedSchemaModel?.oneOf || selectedSchemaModel?.anyOf"
      :property="selectedSchemaModel"
      :property-name="selectedSchemaModel.title || variantSelectItemList[selectedVariantIndex].label"
      :required-fields="selectedSchemaModel?.required"
    />
    <template
      v-for="(property, propertyName) in selectedSchemaModel?.properties"
      :key="propertyName"
    >
      <ModelProperty
        v-if="isValidSchemaObject(property)"
        :data-testid="`model-property-${propertyName}`"
        :property="property"
        :property-name="propertyName.toString()"
        :required-fields="selectedSchemaModel?.required"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import ModelProperty from './ModelProperty.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import type { SchemaObject, SelectItem } from '@/types'
import { isValidSchemaObject, resolveSchemaObjectFields } from '@/utils'
import useSchemaVariants from '@/composables/useSchemaVariants'

const props = defineProps({
  schema: {
    type: Object as PropType<SchemaObject>,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
})

const resolvedSchemaObject = computed(() => resolveSchemaObjectFields(props.schema))
const { variantSelectItemList, selectedSchemaModel, selectedVariantIndex } = useSchemaVariants(resolvedSchemaObject)
const selectedVariantOption = ref('0')
function handleVariantSelectChange(selecteditem: SelectItem) {
  selectedVariantIndex.value = Number(selecteditem.value)
}

const dataTestId = computed(() => `model-node-${props.title.replaceAll(' ', '-')}`)
</script>

<style lang="scss" scoped>
.model-node-container {
  /**
    Apply the border to ModelNode children, except when
    the ModelNode is itself nested in a ModelProperty.
    We do this by checking if the nested-model-node class is present,
    which is applied to a ModelNode that's nested inside ModelProperty.
   */
  &:not(.nested-model-node) {
    > :not(:last-child, .model-node-variant-select){
      border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    }
  }
}
</style>
