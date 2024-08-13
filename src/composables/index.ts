import useSchemaParser from './useSchemaParser'
import useShiki from './useShiki'
import useCurrentCallback from './useCurrentCallback'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useSchemaParser,
  useShiki,
  useCurrentCallback,
}
