// composable to manage schema variants for oneOf/anyOf
import { computed, ref, type ComputedRef } from 'vue'
import type { SchemaObject, SelectItem } from '@/types'
import { inheritedPropertyName, isValidSchemaObject } from '@/utils'

export default function useSchemaVariants(schemaModel: ComputedRef<SchemaObject>) {
  const inheritanceTypeLabel = computed(() =>
    schemaModel.value?.oneOf?.length
      ? 'oneOf'
      : schemaModel.value?.anyOf?.length
        ? 'anyOf'
        : '',
  )

  // get the list of variants, from oneOf or anyOf, or an empty array in case neither are present
  const schemaVariantList = computed(() =>
    (schemaModel.value?.oneOf || schemaModel.value?.anyOf || []).filter(
      isValidSchemaObject,
    ),
  )

  // get the list of items to show in variant select dropdown
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
  // computed to get the selected variant schema object
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
