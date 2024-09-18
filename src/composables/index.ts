import useSchemaParser from './useSchemaParser'
import useShiki from './useShiki'
import useCurrentCallback from './useCurrentCallback'
import useCurrentResponse from './useCurrentResponse'
import useServerList from './useServerList'
import useAuthTokenState from './useAuthTokenState'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useSchemaParser,
  useShiki,
  useCurrentCallback,
  useCurrentResponse,
  useServerList,
  useAuthTokenState,
}
