import { describe, it, expect } from 'vitest'
import useSchemaVariants from './useSchemaVariants'
import { computed } from 'vue'
import type { SchemaObject } from '@/types'

const schemaList: SchemaObject[] = [
  {
    title: 'product-version',
    properties: {
      name: {
        description: 'The name of the API product version.',
      },
    },
  },
  {
    properties: {
      sample: {
        description: 'A sample description',
      },
    },
  },
]
describe('useSchemaVariants', () => {
  describe('inheritanceTypeLabel', () => {
    it('returns valid label for schema model with oneOf', () => {
      const schemaModel = computed((): SchemaObject => ({
        type: 'object',
        oneOf: schemaList,
      }))

      const { inheritanceTypeLabel } = useSchemaVariants(schemaModel)
      expect(inheritanceTypeLabel.value).toBe('One Of')
    })
    it('returns valid label for schema model with anyOf', () => {
      const schemaModel = computed((): SchemaObject => ({
        type: 'object',
        anyOf: schemaList,
      }))

      const { inheritanceTypeLabel } = useSchemaVariants(schemaModel)
      expect(inheritanceTypeLabel.value).toBe('Any Of')
    })
    it('returns valid label for schema model with neither oneOf nor anyOf', () => {
      const schemaModel = computed((): SchemaObject => ({
        type: 'object',
      }))

      const { inheritanceTypeLabel } = useSchemaVariants(schemaModel)
      expect(inheritanceTypeLabel.value).toBe('')
    })
  })
  describe('variantSelectItemList', () => {
    it('returns valid list for schema model with oneOf', () => {
      const schemaModel = computed((): SchemaObject => ({
        type: 'object',
        oneOf: schemaList,
      }))

      const { variantSelectItemList } = useSchemaVariants(schemaModel)
      expect(variantSelectItemList.value).toEqual([
        {
          key: 'product-version',
          value: '0',
          label: 'product-version',
        },
        {
          key: 'Variant 2',
          value: '1',
          label: 'Variant 2',
        },
      ])
    })
    it('returns valid list for schema model with anyOf', () => {
      const schemaModel = computed((): SchemaObject => ({
        type: 'object',
        anyOf: schemaList,
      }))

      const { variantSelectItemList } = useSchemaVariants(schemaModel)
      expect(variantSelectItemList.value).toEqual([
        {
          key: 'product-version',
          value: '0',
          label: 'product-version',
        },
        {
          key: 'Variant 2',
          value: '1',
          label: 'Variant 2',
        },
      ])
    })
    it('returns valid list for schema model with neither oneOf nor anyOf', () => {
      const schemaModel = computed((): SchemaObject => ({
        type: 'object',
      }))

      const { variantSelectItemList } = useSchemaVariants(schemaModel)
      expect(variantSelectItemList.value).toEqual([])
    })
  })
  describe('selectedSchemaModel', () => {
    it('returns valid selectedSchemaModel for schema model with oneOf', () => {
      const schemaModel = computed((): SchemaObject => ({
        type: 'object',
        oneOf: schemaList,
      }))

      const { selectedSchemaModel } = useSchemaVariants(schemaModel)
      expect(selectedSchemaModel.value).toEqual(schemaList[0])
    })
    it('returns valid selectedSchemaModel for schema model with anyOf', () => {
      const schemaModel = computed((): SchemaObject => ({
        type: 'object',
        anyOf: schemaList,
      }))

      const { selectedSchemaModel } = useSchemaVariants(schemaModel)
      expect(selectedSchemaModel.value).toEqual(schemaList[0])
    })
    it('returns valid selectedSchemaModel for schema model with neither oneOf nor anyOf', () => {
      const schemaModel = computed((): SchemaObject => ({
        type: 'object',
      }))

      const { selectedSchemaModel } = useSchemaVariants(schemaModel)
      expect(selectedSchemaModel.value).toEqual(schemaModel.value)
    })
    it('updates when selectedVariantIndex changes', () => {
      const schemaModel = computed((): SchemaObject => ({
        type: 'object',
        oneOf: schemaList,
      }))

      const { selectedSchemaModel, selectedVariantIndex } = useSchemaVariants(schemaModel)

      // initial value is the first item in schemaList array
      expect(selectedSchemaModel.value).toEqual(schemaList[0])
      selectedVariantIndex.value = 1
      // updated value is the second item in schemaList array
      expect(selectedSchemaModel.value).toEqual(schemaList[1])
    })
  })

  describe('cycle detection', () => {
    it('is not circular when there is no ancestor overlap', () => {
      const schemaA: SchemaObject = { type: 'object', title: 'A', oneOf: [{ type: 'object', title: 'B' }] }
      const { isCircularVariant, rawSelectedVariant } = useSchemaVariants(computed(() => schemaA))
      expect(isCircularVariant.value).toBe(false)
      expect(rawSelectedVariant.value?.title).toBe('B')
    })

    it('detects a direct self-reference immediately', () => {
      const schemaA: SchemaObject = { type: 'object', title: 'A' }
      schemaA.oneOf = [schemaA]
      const { isCircularVariant } = useSchemaVariants(computed(() => schemaA))
      expect(isCircularVariant.value).toBe(true)
    })

    // resolveSchemaObjectFields returns a freshly-copied object for array-typed schemas (to hoist
    // the items' fields up), so a cycle running back through an array-typed intermediate variant
    // can only be detected by tracking each level's raw (pre-resolve) schema, not the resolved
    // selectedSchemaModel - this is the same identity-breaking shape found in crawl() and
    // _schemaHasSensitiveData, reproduced here at the composable level
    it('detects a cycle running back through an array-typed intermediate variant', () => {
      const variantArr: SchemaObject = { type: 'array', items: {} }
      variantArr.items = { type: 'object', oneOf: [variantArr] }
      const schemaA: SchemaObject = { type: 'object', title: 'A', oneOf: [variantArr] }

      // level 1: root schema, selects variantArr as its variant
      const root = useSchemaVariants(computed(() => schemaA))
      expect(root.isCircularVariant.value).toBe(false)
      expect(root.rawSelectedVariant.value).toBe(variantArr)

      // level 2: descends into variantArr itself, using the raw identity + ancestor set a
      // recursive render would pass down - variantArr's own (hoisted) oneOf points back to itself
      const level2 = useSchemaVariants(
        computed(() => root.rawSelectedVariant.value as SchemaObject),
        computed(() => root.ancestorsIncludingSelf.value),
      )
      expect(level2.isCircularVariant.value).toBe(true)
    })
  })
})
