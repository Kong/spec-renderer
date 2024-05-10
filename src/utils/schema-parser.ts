import composables from '../composables'

const {
  parseSpecDocument,
  parsedDocument,
  jsonDocument,
  tableOfContents,
  validationResults,
} = composables.useSchemaParser()

export {
  parseSpecDocument,
  parsedDocument,
  jsonDocument,
  tableOfContents,
  validationResults,
}
