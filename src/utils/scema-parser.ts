import composables from '../composables'

const {
  parse,
  parsedDocument,
  jsonDocument,
  tableOfContents,
  validationResults,
} = composables.useSchemaParser()

export {
  parse,
  parsedDocument,
  jsonDocument,
  tableOfContents,
  validationResults,
}
