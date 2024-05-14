import type { SchemaObject as OAS31SchemaObject, ReferenceObject as OAS31ReferenceObject } from 'openapi3-ts/oas31'

export interface SpecRendererProps {
  modelValue: string
}

/**
 * Wrapper types so that we don't import/use types from a 3rd party library, like openapi3-ts, directly in our code.
 * This way it'll be easy to replace out this library with some other library, or even our own implementation,
 * without requiring major refactoring.
 */
export interface SchemaObject extends OAS31SchemaObject {}
export interface ReferenceObject extends OAS31ReferenceObject {}

export interface ParseOptions {
  specUrl?: string
  hideSchemas: boolean
  hideInternal: boolean
}
