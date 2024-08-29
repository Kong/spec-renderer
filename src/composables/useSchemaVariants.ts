// composable to manage schema variants for oneOf/anyOf
import { computed, ref, type ComputedRef } from 'vue'
import type { SchemaObject, SelectItem } from '@/types'
import { inheritedPropertyName, isValidSchemaObject, resolveSchemaObjectFields } from '@/utils'

export default function useSchemaVariants(schemaModel: ComputedRef<SchemaObject>) {
  const inheritanceTypeLabel = computed(() =>
    schemaModel.value?.oneOf?.length
      ? 'ONE OF'
      : schemaModel.value?.anyOf?.length
        ? 'ANY OF'
        : '',
  )

  // get the list of variants, from oneOf or anyOf, or an empty array in case neither are present
  const schemaVariantList = computed(() =>
    (schemaModel.value?.oneOf || schemaModel.value?.anyOf || []).filter(
      isValidSchemaObject,
    ).map(resolveSchemaObjectFields),
  )

  /**
   * If the schema model has variants, it returns the list of variants, else it returns an empty array
   */
  const variantSelectItemList = computed((): Array<SelectItem> => {
    return schemaVariantList.value.map((variant, index) => {
      const variantTitle = inheritedPropertyName(index, variant.title)
      return {
        key: variantTitle,
        value: index.toString(),
        label: variantTitle,
      }
    })
  })

  // ref to store the index of the selected variant
  const selectedVariantIndex = ref<number>(0)
  /**
   * If the schema model has variants, it returns the selected variant, else it returns the schema model itself
   */
  const selectedSchemaModel = computed(() => {
    const schemaVariant = schemaVariantList.value[selectedVariantIndex.value]
    return schemaVariant ?? schemaModel.value
  })

  return {
    inheritanceTypeLabel,
    variantSelectItemList,
    selectedVariantIndex,
    selectedSchemaModel,
  }
}
