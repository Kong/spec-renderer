import composables from '../composables'

const {
  parseSpecDocument,
  parsedDocument,
  tableOfContents,
  validationResults,
} = composables.useSchemaParser()

export {
  parseSpecDocument,
  parsedDocument,
  tableOfContents,
  validationResults,
}
