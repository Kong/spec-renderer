// composable to manage schema variants for oneOf/anyOf
import { computed, ref } from 'vue'
import type { SchemaObject } from '@/types'
import { inheritedPropertyName, isValidSchemaObject, resolveSchemaObjectFields } from '@/utils'

export default function useSchemaVariants(schemaModel: SchemaObject) {

  // resolve the schema object, so we can extract fields from it
  const resolvedSchemaObject = resolveSchemaObjectFields(schemaModel)
  // get the list of variants, from oneOf or anyOf, or an empty array in case neither are present
  const schemaVariantList = (resolvedSchemaObject?.oneOf || resolvedSchemaObject?.anyOf || []).filter(
    isValidSchemaObject)
  // get the list of variant titles
  const variantTitleList = schemaVariantList.map((variant, index) => inheritedPropertyName(index, variant.title))

  // ref to store the index of the selected variant
  const selectedVariantIndex = ref<number>(0)
  // computed to get the selected variant schema object
  const selectedSchemaModel = computed(() => {
    const schemaVariant = schemaVariantList[selectedVariantIndex.value]
    return schemaVariant ?? resolvedSchemaObject
  })

  return {
    variantTitleList,
    selectedVariantIndex,
    selectedSchemaModel,
  }
}
