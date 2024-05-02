import type { SchemaObject } from '@/types'
import { isValidSchemaObject } from '@/utils'
import PropertyDescription from './PropertyDescription.vue'
import PropertyExample from './PropertyExample.vue'
import PropertyInfo from './PropertyInfo.vue'
import PropertyEnum from './PropertyEnum.vue'

export interface PropertyComponentArgs {
  property: SchemaObject;
  fieldName: keyof SchemaObject;
  requiredFields?: string[];
  propertyTitle?: string;
}

export const propertyComponentMap: Record<string, unknown> = {
  description: PropertyDescription,
  example: PropertyExample,
  enum: PropertyEnum,
  type: PropertyInfo,
}

export const propertyComponentProps = ({ property, fieldName, propertyTitle, requiredFields }: PropertyComponentArgs) => {
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
    case 'type':
      return {
        title: property.title || propertyTitle,
        propertyType: property.type,
        format: property.format,
        propertyItemtype:
            isValidSchemaObject(property.items) && property.items.type
              ? property.items.type
              : '',
        requiredFields: property.required || requiredFields,
      }
    default:
      return {
        component: PropertyDescription,
      }
  }
}
