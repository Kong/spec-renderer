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
}

export type SchemaModelPropertyField = 'info' | 'description' | 'enum' | 'pattern' | 'range' | 'example' | 'default'



export interface KongSpecRendererOptions {
  shadowDom?: boolean
  injectCss?: string[]
}
