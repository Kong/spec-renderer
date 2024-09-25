import { describe, it, expect } from 'vitest'
import useSchemaVariants from './useSchemaVariants'
import { computed } from 'vue'
import type { SchemaObject } from '@/types'

const schemaList: Array<SchemaObject> = [
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
})
