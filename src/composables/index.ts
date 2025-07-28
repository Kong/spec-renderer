import useSchemaParser from './useSchemaParser'
import useShiki from './useShiki'
import useCurrentCallback from './useCurrentCallback'
import useCurrentResponse from './useCurrentResponse'
import useContentTypes from './useContentTypes'
import useServerList from './useServerList'
import useTryItState from './useTryItState'
import useMarkdown from './useMarkdown'
import useAuth from './useAuth'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useSchemaParser,
  useShiki,
  useCurrentCallback,
  useCurrentResponse,
  useContentTypes,
  useServerList,
  useTryItState,
  useMarkdown,
  useAuth,
}
