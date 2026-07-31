import composables from '../composables'

export type { ParseResult } from '../composables/useSchemaParser'

/*
 * NOTE (cross-request state bleed): `useSchemaParser()` is invoked ONCE here, so the exported
 * `parsedDocument` / `tableOfContents` refs are a single set shared by every importer for the
 * whole process lifetime. Under concurrent SSR they are last-writer-wins and can therefore hold
 * a *different* request's document. The parse functions now RETURN the request-local result
 * (`ParseResult`) — read that instead of the shared refs. The refs remain exported only for
 * backward compatibility with existing (single-request / client) consumers.
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
  /**
   * @deprecated Process-global ref shared by every importer; unsafe to read under concurrent SSR
   * (it may hold another request's document). Read the `parsedDocument` field of the value returned
   * by `parseSpecDocument` / `parseOpenApiSpecDocument` / `parseAsyncApiSpecDocument` instead.
   */
  parsedDocument,
  /**
   * @deprecated Process-global ref shared by every importer; unsafe to read under concurrent SSR
   * (it may hold another request's table of contents). Read the `tableOfContents` field of the value
   * returned by `parseSpecDocument` / `parseOpenApiSpecDocument` / `parseAsyncApiSpecDocument` instead.
   */
  tableOfContents,
}
