import { computed, reactive, toRefs } from 'vue'
import type { SecuritySchemeGroup, SelectItem } from '@/types'
import type { HttpSecurityScheme } from '@stoplight/types'
import { useDebounceFn } from '@vueuse/core'

interface AuthTokenState {
  // list of token values
  tokenValues: Array<string>
  securitySchemeGroupList: Array<SecuritySchemeGroup>
  activeSchemeGroupKey: string
  authHeaders: Array<Record<string, string>>
  authQuery: string
}

const state: AuthTokenState = reactive({
  tokenValues: [],
  securitySchemeGroupList: [],
  activeSchemeGroupKey: '',
  authHeaders: [],
  authQuery: '',
})

export default function useAuthTokenState() {
  const { tokenValues, securitySchemeGroupList, activeSchemeGroupKey, authHeaders, authQuery } = toRefs(state)

  /**
   * Initialize token values array with empty strings.
   *
   * Also resets auth headers and query.
   *
   * @param tokenCount Number of tokens to initialize.
   */
  const initializeTokenValues = (tokenCount = 0) => {
    state.tokenValues = Array.from({ length: tokenCount }, () => '')
    state.authHeaders = []
    state.authQuery = ''
  }

  /**
   * Initialize `securitySchemeGroupList`, active security scheme group and token values.
   *
   * `securitySchemeGroupList` is an array of security scheme groups, with each group having
   * a title, key and a list of security schemes.
   *
   * This function is called in SpecDocument whenever a new spec is loaded.
   *
   * @param security security schemes list defined in the spec.
   */
  const initializeSecuritySchemeGroupList = (security: HttpSecurityScheme[][]) => {
    const schemeGroupList = []
    for (const secGroup of security) {
      if (secGroup.length) {
        let title = ''
        let key = ''
        secGroup.forEach((scheme) => {
          title = title.length ? title + ` & ${scheme.key}` : scheme.key,
          key = key.length ? key + `-${scheme.key.replace(' ', '-')}` : scheme.key.replace(' ', '-')
        })
        schemeGroupList.push({
          title,
          key,
          schemeList: secGroup,
        })
      }
    }
    state.securitySchemeGroupList = schemeGroupList
    state.activeSchemeGroupKey = schemeGroupList[0]?.key ?? ''
    initializeTokenValues(schemeGroupList[0]?.schemeList?.length)
  }

  /**
   * Returns the list of security scheme groups as select items,
   * to be used in the security scheme group select dropdown.
   */
  const securitySchemeGroupSelectItems = computed<Array<SelectItem>>(() => {
    return securitySchemeGroupList.value.map((group) => ({
      label: group.title,
      value: group.key,
      key: group.key,
    }))
  })

  /**
   * Returns the list of security schemes for the active security scheme group.
   */
  const activeSecuritySchemeList = computed(() =>
    state.securitySchemeGroupList.find(group => group.key === state.activeSchemeGroupKey)?.schemeList ?? [],
  )

  const handleTokenInput = useDebounceFn((event: Event, index: number) => {
    const value = (event.target as HTMLInputElement).value
    tokenValues.value[index] = value

    const headers:Array<Record<string, string>> = []
    const query: Record<string, string> = {}
    tokenValues.value.forEach((tokenValue, i) => {
      if (activeSecuritySchemeList.value?.[i]) {
        const scheme: HttpSecurityScheme = activeSecuritySchemeList.value[i]
        // @ts-ignore `name` is valid attribute of the schema
        const schemeName = scheme.name
        // @ts-ignore `in` is valid attribute of the schema
        const schemeIn = scheme.in
        // @ts-ignore `scheme` is valid attribute of the schema
        const isBearer = scheme.scheme == 'bearer'
        if (scheme) {
          if (schemeIn === 'query') {
            query[schemeName] = tokenValue
          } else {
            const headerName = isBearer || !schemeName ? 'Authorization' : schemeName
            headers.push({
              name: headerName,
              value: `${isBearer ? 'Bearer ' : ''} ${tokenValue}`,
            })
          }
        }
      }
    })
    state.authHeaders = headers
    state.authQuery = new URLSearchParams(query).toString()
  }, 800)

  return {
    initializeTokenValues,
    initializeSecuritySchemeGroupList,
    handleTokenInput,
    tokenValues,
    securitySchemeGroupList,
    securitySchemeGroupSelectItems,
    activeSchemeGroupKey,
    activeSecuritySchemeList,
    authHeaders,
    authQuery,
  }
}
