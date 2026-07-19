// composable to manage schema variants for oneOf/anyOf
import { computed, ref, unref, type ComputedRef, type Ref } from 'vue'
import type { SchemaObject, SelectItem } from '@/types'
import { inheritedPropertyName, isValidSchemaObject, resolveSchemaObjectFields } from '@/utils'

/**
 * @param rawSchema The schema to compute variants from, pre-resolve (resolved internally)
 * @param ancestorSchemas Raw ancestor schemas already visited in this render chain, for
 * detecting a oneOf/anyOf variant that cycles back to an ancestor. Must stay keyed on raw
 * (pre-resolve) objects - resolveSchemaObjectFields copies array/allOf schemas on every call,
 * so keying on its output would give a revisited schema a new identity each time.
 */
export default function useSchemaVariants(
  rawSchema: ComputedRef<SchemaObject> | Ref<SchemaObject>,
  ancestorSchemas: Ref<Set<object>> | ComputedRef<Set<object>> = ref(new Set()),
) {
  const resolvedSchemaObject = computed(() => resolveSchemaObjectFields(unref(rawSchema)))

  const inheritanceTypeLabel = computed(() =>
    resolvedSchemaObject.value?.oneOf?.length
      ? 'One Of'
      : resolvedSchemaObject.value?.anyOf?.length
        ? 'Any Of'
        : '',
  )

  // raw (pre-resolve) variants from oneOf/anyOf, filtered - same indices as schemaVariantList below
  const rawVariantList = computed((): SchemaObject[] =>
    (resolvedSchemaObject.value?.oneOf || resolvedSchemaObject.value?.anyOf || []).filter(isValidSchemaObject),
  )

  const schemaVariantList = computed(() => rawVariantList.value.map(resolveSchemaObjectFields))

  /**
   * If the schema model has variants, it returns the list of variants, else it returns an empty array
   */
  const variantSelectItemList = computed((): SelectItem[] => {
    return schemaVariantList.value.map((variant, index) => {
      const variantTitle = inheritedPropertyName(index, variant.title)
      return {
        key: variantTitle,
        value: index.toString(),
        label: variantTitle + `${variant.deprecated ? ' (deprecated)' : ''}`,
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
    return schemaVariant ?? resolvedSchemaObject.value
  })

  // the raw (pre-resolve) selected variant - the identity checked for cycles, and what a
  // recursive render should pass down as its own schema
  const rawSelectedVariant = computed<SchemaObject | undefined>(() => rawVariantList.value[selectedVariantIndex.value])

  // ancestors plus this schema's own identity, registered immediately so a variant cycling
  // straight back to this node (not just a more distant ancestor) is caught with no extra hop
  const ancestorsIncludingSelf = computed(() => {
    const next = new Set(unref(ancestorSchemas))
    next.add(unref(rawSchema))
    return next
  })

  const isCircularVariant = computed(() =>
    Boolean(rawSelectedVariant.value) && ancestorsIncludingSelf.value.has(rawSelectedVariant.value as object),
  )

  return {
    resolvedSchemaObject,
    inheritanceTypeLabel,
    variantSelectItemList,
    selectedVariantIndex,
    selectedSchemaModel,
    rawSelectedVariant,
    isCircularVariant,
    ancestorsIncludingSelf,
  }
}
