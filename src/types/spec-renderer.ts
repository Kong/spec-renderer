import type { JSONSchema7, JSONSchema7Type } from 'json-schema'

export interface SpecRendererProps {
  modelValue: string
}

/**
 * Wrapper types so that we don't import/use types from a 3rd party library, like openapi3-ts, directly in our code.
 * This way it'll be easy to replace out this library with some other library, or even our own implementation,
 * without requiring major refactoring.
 */
export interface SchemaObject extends JSONSchema7 {
  example?: JSONSchema7Type
  /**
   * added as part of JSON Schema draft 2019-09
   * https://json-schema.org/draft/2019-09/release-notes#meta-data-vocabulary
   */
  deprecated?: boolean
  /**
   * used to show array item type
   * e.g. array [string]
   */
  itemType?: JSONSchema7['type']
}


export interface ParseOptions {
  /**
   * Url to fetch spec (if not defined by spec blob (text))
   */
  specUrl?: string
  /**
   * Selected path to load document with
   */
  currentPath?: string
  /**
   * Do not include schemas (models) into parsing results
   */
  hideSchemas?: boolean
  /**
   * do not include internal methods into parsing results
   */
  hideInternal?: boolean
  /**
   * do not include deprecated methods into parsing results
   */
  hideDeprecated?: boolean
  /**
   * console.logs the progress of parsing steps
   */
  traceParsing?: boolean
  /**
   * when fetching http reference - using withCredentials directive
   */
  withCredentials?: boolean
  /**
   * stringify returned Document, TOC and validation results
   */
  webComponentSafe?: boolean

}

export type SchemaModelPropertyField = 'info' | 'description' | 'enum' | 'pattern' | 'range' | 'example' | 'default' | 'additional-properties'
