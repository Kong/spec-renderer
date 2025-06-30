import type { JSONSchema7, JSONSchema7Type } from 'json-schema'

export interface SpecRendererProps {
  /** Text of the specification. */
  spec: string
  /**
   * Path of the page where spec-renderer is loaded on.
   * This is needed to compute path to individual specification details
   */
  basePath?: string
  /** Selected path of the spec section (UI). */
  currentPath?: string
  /** URL to fetch spec document from. */
  specUrl?: string
  /**
   * Allow component itself to control URL in browser URL.
   * When false it becomes the responsibility of consuming app.
   */
  controlAddressBar?: boolean | 'true' | 'false'
  /**
   * Defines how links are specified in toc.
   * - path - id becomes part of the URL path.
   * - hash - uses the hash portion of the URL to keep the UI in sync with the URL.
  */
  navigationType?: 'path' | 'hash'
  /** Hide schemas from TOC. */
  hideSchemas?: boolean | 'true' | 'false'
  /** Hide internal endpoints from TOC. */
  hideInternal?: boolean | 'true' | 'false'
  /** Hide deprecated endpoints from TOC. */
  hideDeprecated?: boolean | 'true' | 'false'
  /** Hide the "Try it" UI. */
  hideTryIt?: boolean | 'true' | 'false'
  /** Hide the "Insomnia" option in the "Try it" UI. */
  hideInsomniaTryIt?: boolean | 'true' | 'false'
  /** Console log the parsing process and stages. */
  traceParsing?: boolean | 'true' | 'false'
  /** Use withCredential instructions when fetching external (http) references during parsing. */
  withCredentials?: boolean | 'true' | 'false'
  /** Allow scrolling trough operations/schemas. */
  allowContentScrolling?: boolean | 'true' | 'false'
  /** Scrolling container that holds the `SpecDocument`. Use window by default. */
  documentScrollingContainer?: string
  /** Use default markdown styling. If your host application provides its own default styles, you may want to set to `false`. */
  markdownStyles?: boolean | 'true' | 'false'
  /** Allow user to add custom server url which will be added to the list of available servers. */
  allowCustomServerUrl?: boolean | 'true' | 'false'
  /**
   * Hide navigation buttons at the bottom of the document.
   * Only relevant when not in content scrolling mode.
   */
  hideNavigationButtons?: boolean | 'true' | 'false'
  /** Hide the spec download button. */
  hideDownloadButton?: boolean | 'true' | 'false'
  /** The max depth until which nested properties should remain expanded by default. */
  maxExpandedDepth?: number | string
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
  'x-stoplight'?: {
    /**
     * list of fields explicitly defined in the spec for a property
     */
    explicitProperties?: string[]
  }
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
  /**
   * enforce reset of json document, enforces reset when API type specific function is called directly (portal ssr case)
   */
  enforceResetBeforeParsing?: boolean

}

export const RangeFields = [
  'maximum',
  'minimum',
  'maxLength',
  'minLength',
  'exclusiveMaximum',
  'exclusiveMinimum',
  'multipleOf',
  'maxItems',
  'minItems',
] as const

export type SchemaModelPropertyField = 'info' | 'description' | 'enum' | 'pattern' | 'range' | 'example' | 'examples' | 'default' | 'additionalProperties' | typeof RangeFields[number]
