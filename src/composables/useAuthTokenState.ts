import { computed, reactive, toRefs, watch } from 'vue'
import type { SecuritySchemeGroup, SelectItem } from '@/types'
import type { HttpSecurityScheme } from '@stoplight/types'

interface AuthTokenState {
  // list of token values
  tokenValues: Array<string>
  securitySchemeGroupList: Array<SecuritySchemeGroup>
  activeSchemeGroupKey: string
}

const state: AuthTokenState = reactive({
  tokenValues: [],
  securitySchemeGroupList: [],
  activeSchemeGroupKey: '',
})

export default function useAuthTokenState() {
  const { tokenValues, securitySchemeGroupList, activeSchemeGroupKey } = toRefs(state)

  /**
   * Initialize token values array with empty strings.
   *
   * @param tokenCount Number of tokens to initialize.
   */
  const initializeTokenValues = (tokenCount = 0) => {
    state.tokenValues = Array.from({ length: tokenCount }, () => '')
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
  const activeSecuritySchemeList = computed<Array<HttpSecurityScheme> | undefined>(() =>
    state.securitySchemeGroupList.find(group => group.key === state.activeSchemeGroupKey)?.schemeList,
  )

  // Reset token values when active security scheme group changes
  watch(activeSchemeGroupKey, () => {
    initializeTokenValues(activeSecuritySchemeList.value?.length)
  })

  return {
    initializeTokenValues,
    initializeSecuritySchemeGroupList,
    tokenValues,
    securitySchemeGroupList,
    securitySchemeGroupSelectItems,
    activeSchemeGroupKey,
    activeSecuritySchemeList,
  }
}
