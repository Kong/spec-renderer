// composable to manage schema variants for oneOf/anyOf
import { computed, ref, type ComputedRef } from 'vue'
import type { SchemaObject } from '@/types'
import { inheritedPropertyName, isValidSchemaObject } from '@/utils'

export default function useSchemaVariants(schemaModel: ComputedRef<SchemaObject>) {

  // get the list of variants, from oneOf or anyOf, or an empty array in case neither are present
  const schemaVariantList = computed(() => (schemaModel.value?.oneOf || schemaModel.value?.anyOf || []).filter(
    isValidSchemaObject))
  // get the list of variant titles
  const variantTitleList = computed(() => schemaVariantList.value.map((variant, index) => inheritedPropertyName(index, variant.title)))

  // ref to store the index of the selected variant
  const selectedVariantIndex = ref<number>(0)
  // computed to get the selected variant schema object
  const selectedSchemaModel = computed(() => {
    const schemaVariant = schemaVariantList.value[selectedVariantIndex.value]
    return schemaVariant ?? schemaModel.value
  })

  return {
    variantTitleList,
    selectedVariantIndex,
    selectedSchemaModel,
  }
}
