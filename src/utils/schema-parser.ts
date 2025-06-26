import composables from '../composables'

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
  parsedDocument,
  tableOfContents,
}
