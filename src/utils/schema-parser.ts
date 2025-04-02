import composables from '../composables'

const {
  parseSpecDocument,
  parsedDocument,
  tableOfContents,
  validationResults,
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
  validationResults,
}
