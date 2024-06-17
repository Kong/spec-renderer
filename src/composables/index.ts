import useSchemaParser from './useSchemaParser'
import useShiki from './useShiki'
import useResponseCode from './useResponseCode'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useSchemaParser,
  useShiki,
  useResponseCode,
}
