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

const activeSecurityScheme = ref<string>('')
const authInputs = ref<Record<string, string>>({})
const authHeadersMap = ref<Record<string, Array<Record<string, string>>>>({})
const authQueryMap = ref<Record<string, string>>({})

/**
 * Centralized state for auth token values.
 */
export default function useAuth() {
  return {
    /**
     * state for storing the active security scheme group key.
     * e.g. "bearerAuth-xApiKeyAuth"
     * gets initialized in HttpOperation
     */
    activeSecurityScheme,

    /**
     * state for storing input values for security scheme, we try to keep those flat as they are fixed for specific security themes (eg, basic has username and password)
     * e.g.
     * ```
     * {
     *   "keyAuth1-username": "sample-username",
     *   "keyAuth1-password": "sample-password",
     *   "keyAuth2-token": "sample-token",
     * }
     * ```
     * Key is the security scheme key, value is the input value.
     */
    authInputs,

    /**
     * state for storing list of auth header objects for each security scheme.
     * e.g.
     * ```
     * {
     *   "keyAAuthGroup1": [
     *     {
     *       "name": "Authorization",
     *       "value": "sample-api-key"
     *     },
     *     {
     *       "name": "X-API-Key",
     *       "value": "sample-x-api-key"
     *     }
     *   "keyAAuthGroup2": [
     *     {
     *       "name": "Authorization",
     *       "value": "Basic encoded-value"
     *     },
     *   ]
     * }
     * ```
     * The key is the security scheme group key, value is list of auth header objects.
     *
     * Auth header object: key is security scheme name, value is the token value.
     */
    authHeadersMap,


    /**
     * state for storing auth query string for each security scheme.
     * e.g.
     * ```
     * {
     *   "apiKeyAuth-xApiKeyAuth": "apikey=sample-api-key&x-api-key=sample-x-api-key"
     * }
     * ```
     * The key is the security scheme group key, value is the unified query param string.
     */
    authQueryMap,
  }
}
