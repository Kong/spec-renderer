import type { SchemaObject as OAS31SchemaObject, ReferenceObject as OAS31ReferenceObject } from 'openapi3-ts/oas31'

export interface SpecRendererProps {
  modelValue: string
}

export interface SchemaObject extends OAS31SchemaObject {}
export interface ReferenceObject extends OAS31ReferenceObject {}
