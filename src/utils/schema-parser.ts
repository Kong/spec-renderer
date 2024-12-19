import composables from '../composables'

const {
  parseSpecDocument,
  parsedDocument,
  tableOfContents,
  validationResults,
  parseOpenApiSpecDocument,
  parseAsyncApiSpecDocument,
} = composables.useSchemaParser()

export {
  parseSpecDocument,
  parseOpenApiSpecDocument,
  parseAsyncApiSpecDocument,
  parsedDocument,
  tableOfContents,
  validationResults,
}
