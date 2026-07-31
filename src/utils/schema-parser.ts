import composables from '../composables'

/**
 * `useSchemaParser()` is invoked ONCE here, so the exported `parsedDocument` / `tableOfContents`
 * refs are shared process-wide and become last-writer-wins under concurrent SSR. Read the
 * `ParseResult` returned by the parse functions instead; the refs remain only for backward compat.
 */
const {
  parseSpecDocument,
  parsedDocument,
  tableOfContents,
  parseOpenApiSpecDocument,
  parseAsyncApiSpecDocument,
  downloadSpecFile,
} = composables.useSchemaParser()

export {
  parseSpecDocument,
  parseOpenApiSpecDocument,
  parseAsyncApiSpecDocument,
  downloadSpecFile,
  /** @deprecated Shared process-global ref, unsafe under concurrent SSR. Read the `parsedDocument` field of the parse functions' returned `ParseResult` instead. */
  parsedDocument,
  /** @deprecated Shared process-global ref, unsafe under concurrent SSR. Read the `tableOfContents` field of the parse functions' returned `ParseResult` instead. */
  tableOfContents,
}
