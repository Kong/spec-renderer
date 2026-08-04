import type { JSONSchema7, JSONSchema7Type } from 'json-schema'
import type { XSensitiveData } from './sensitive-data'
import type { ServiceNode } from './node-type'
import type { TableOfContentsItem } from '@/stoplight/elements-core'

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
  /** Show a permalink icon on each operation that copies its URL to clipboard. */
  enableOperationLinks?: boolean | 'true' | 'false'
  /** Show the "Powered by Kong" content in the SpecRendererTOC. Defaults to `false` */
  showPoweredBy?: boolean | 'true' | 'false'
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
  'x-sensitive-data'?: XSensitiveData
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
   * @deprecated No longer required. Each parse now always (re)bundles the provided spec, so parsing
   * is fail-safe under concurrency regardless of this flag — it is retained only for backward
   * compatibility and has no effect. Previously needed to force a reset when an API-type-specific
   * parse function was called directly on the shared module instance (portal SSR case).
   */
  enforceResetBeforeParsing?: boolean

}

/**
 * The request-local result of a parse call (`parseSpecDocument` / `parseOpenApiSpecDocument` /
 * `parseAsyncApiSpecDocument`).
 *
 * The parse functions also assign the composable's `parsedDocument` / `tableOfContents` refs for
 * backward compatibility, but under concurrent SSR those shared refs can be overwritten by an
 * interleaved parse. Prefer reading these returned values, which are guaranteed to belong to this
 * specific call.
 */
export interface ParseResult {
  /** The parsed service node for this call (or its web-component-safe stringified form), or `undefined` when parsing failed. */
  parsedDocument: ServiceNode | string | undefined
  /** The table of contents computed for this call (or its stringified form), or `undefined` when parsing failed. */
  tableOfContents: TableOfContentsItem[] | string | undefined
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
