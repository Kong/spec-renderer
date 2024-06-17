import useSchemaParser from './useSchemaParser'
import useShiki from './useShiki'
import useCurrentResponse from './useCurrentResponse'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useSchemaParser,
  useShiki,
  useCurrentResponse,
}
