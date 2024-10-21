import { ref } from 'vue'

/**
 * Some notes to understand this composable:
 * - auth tokens can be of two type: auth headers (present in request headers) and auth query (present in request query params)
 *   auth headers are stored in an object because we need the header name and value both.
 *   auth queries are stored in a string because we need the query param to be a single string.
 * - there can be multiple security scheme groups. Each group can have multiple security schemes.
 *   security schemes can be common across security scheme groups.
 * - each security scheme will have it's own auth header object and auth query string
 *   same auth token can be reused across multiple security schemes.
 * - auth tokens can also be reused across multiple endpoints & servers. Which is why we have to store them in a common state.
*/


const tokenValueMap = ref<Record<string, string>>({})
const authHeaderMap = ref<Record<string, Array<Record<string, string>>>>({})
const authQueryMap = ref<Record<string, string>>({})

/**
 * Centralized state for auth token values.
 */
export default function useAuthTokenState() {
  return {
    /**
     * state for storing raw auth token values
     * e.g.
     * ```
     * {
     *   "bearerAuth": "sample-jwt",
     *   "apiKeyAuth": "sample-x-api-key",
     *   "API Key": "sample-api-key"
     * }
     * ```
     * Key is the security scheme key, value is the token value.
     */
    tokenValueMap,

    /**
     * state for storing list of auth header objects for each security scheme.
     * e.g.
     * ```
     * {
     *   "bearerAuth-xApiKeyAuth": [
     *     {
     *       "name": "Authorization",
     *       "value": "sample-api-key"
     *     },
     *     {
     *       "name": "X-API-Key",
     *       "value": "sample-x-api-key"
     *     }
     *   ]
     * }
     * ```
     * The key is the securty scheme group key, value is list of auth header objects.
     *
     * Auth header object: key is securty scheme name, value is the token value.
     */
    authHeaderMap,
    /**
     * state for storing auth query string for each security scheme.
     * e.g.
     * ```
     * {
     *   "apiKeyAuth-xApiKeyAuth": "apikey=sample-api-key&x-api-key=sample-x-api-key"
     * }
     * ```
     * The key is the securty scheme group key, value is the unified query param string.
     */
    authQueryMap,
  }
}
