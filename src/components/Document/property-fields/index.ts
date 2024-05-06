import type { SchemaObject } from '@/types'
import { isValidSchemaObject } from '@/utils'
import PropertyDescription from './PropertyDescription.vue'
import PropertyExample from './PropertyExample.vue'
import PropertyInfo from './PropertyInfo.vue'
import PropertyEnum from './PropertyEnum.vue'
import PropertyPattern from './PropertyPattern.vue'
import PropertyRange from './PropertyRange.vue'

interface PropertyComponentArgs {
  property: SchemaObject;
  fieldName: keyof SchemaObject;
  requiredFields?: string[];
  propertyTitle?: string;
}

export const fieldComponentMap: Record<string, unknown> = {
  description: PropertyDescription,
  example: PropertyExample,
  enum: PropertyEnum,
  title: PropertyInfo,
  pattern: PropertyPattern,
  maximum: PropertyRange,
}

/**
 * Returns props for the component to be rendered for a given field.
 *
 * property — object of type SchemaObject from which props are extracted
 *
 * fieldName — name of the property whose component is to be rendered
 *
 * propertyTitle — optional, title of the property from which props are being extracted
 *
 * requiredFields — optional, array of required fields
 *
 * @param {PropertyComponentArgs} args
 */
export const fieldComponentProps = ({ property, fieldName, propertyTitle, requiredFields }: PropertyComponentArgs) => {
  switch (fieldName) {
    case 'description':
      return {
        description: property.description,
      }
    case 'example':
      return {
        example: property.example,
      }
    case 'enum':
      return {
        enumValue: property.enum,
      }
    case 'title':
      return {
        title: propertyTitle,
        propertyType: property.type,
        format: property.format,
        propertyItemtype:
            isValidSchemaObject(property.items) && property.items.type
              ? property.items.type
              : '',
        requiredFields,
      }
    case 'maximum':
      return {
        max: property.maximum,
        min: property.minimum,
      }
    case 'pattern':
      return {
        pattern: property.pattern,
      }
  }
}
