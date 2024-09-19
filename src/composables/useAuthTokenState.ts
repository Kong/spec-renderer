import { reactive, toRefs } from 'vue'

interface AuthTokenState {
  tokenValueMap: Record<string, string>
  authHeaderMap: Record<string, Array<Record<string, string>>>
  authQueryMap: Record<string, string>
}

const state: AuthTokenState = reactive({
  tokenValueMap: {},
  authHeaderMap: {},
  authQueryMap: {},
})

export default function useAuthTokenState() {
  const {
    tokenValueMap,
    authHeaderMap,
    authQueryMap,
  } = toRefs(state)

  return {
    tokenValueMap,
    authHeaderMap,
    authQueryMap,
  }
}
