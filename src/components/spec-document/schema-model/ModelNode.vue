<template>
  <div
    class="model-node-container"
    :data-testid="dataTestId"
  >
    <template v-if="variantSelectItemList.length">
      <div>
        <VariantLabel
          v-if="inheritanceTypeLabel"
          :label="inheritanceTypeLabel"
        />
        <SelectDropdown
          :id="`${dataTestId}-variant-select-dropdown`"
          class="model-node-variant-select"
          :items="variantSelectItemList"
          :model-value="selectedVariantIndex.toString()"
          @change="handleVariantSelectChange"
        />
      </div>
      <!-- if the schema model has variants, render the selected variant -->
      <ModelProperty
        v-if="selectedSchemaModel?.oneOf || selectedSchemaModel?.anyOf"
        :base-path-id="basePathId"
        :depth="depth"
        :property="selectedSchemaModel"
        :property-name="selectedSchemaModel.title || variantSelectItemList[selectedVariantIndex].label"
        :required-fields="selectedSchemaModel?.required"
      />
    </template>

    <!-- render all properties of the schema model -->
    <template
      v-for="(property, propertyName, index) in selectedSchemaModel?.properties"
      :key="propertyName"
    >
      <ModelProperty
        v-if="isValidSchemaObject(property)"
        :base-path-id="basePathId"
        :class="{ 'model-node-property': index !== 0 }"
        :data-testid="`model-property-${propertyName}`"
        :depth="depth"
        :property="property"
        :property-name="propertyName.toString()"
        :required-fields="selectedSchemaModel?.required"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { PropType } from 'vue'
import ModelProperty from './ModelProperty.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import type { SchemaObject, SelectItem } from '@/types'
import { isValidSchemaObject, resolveSchemaObjectFields } from '@/utils'
import useSchemaVariants from '@/composables/useSchemaVariants'
import VariantLabel from '@/components/common/VariantLabel.vue'

const props = defineProps({
  schema: {
    type: Object as PropType<SchemaObject>,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  /**
   * Hides the example field from the model node
   * in case example is already shown on the page
   */
  hideExampleField: {
    type: Boolean,
    default: false,
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

const resolvedSchemaObject = computed(() => resolveSchemaObjectFields(props.schema))
const { variantSelectItemList, selectedSchemaModel, selectedVariantIndex, inheritanceTypeLabel } = useSchemaVariants(resolvedSchemaObject)

function handleVariantSelectChange(selecteditem: SelectItem) {
  selectedVariantIndex.value = Number(selecteditem.value)
}

const emit = defineEmits < {
  (e: 'selected-model-changed', newModel: SchemaObject): void
}>()

watch(selectedSchemaModel, (newModel) => {
  emit('selected-model-changed', newModel)
}, {
  immediate: true,
})

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
    >.model-node-property {
      border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    }
  }
}
</style>
