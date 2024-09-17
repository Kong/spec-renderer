import { reactive, toRefs } from 'vue'


interface AuthTokenState {
  authHeaders: Array<Record<string, string>>
  authQuery: string
  tokenValues :Array<string>
}

const state: AuthTokenState = reactive({
  authHeaders: [],
  authQuery: '',
  tokenValues: [],
})

export default function useAuthTokenState() {
  const { authHeaders, authQuery, tokenValues } = toRefs(state)

  const initializeTokenValues = (tokenCount = 0) => {
    state.tokenValues = Array.from({ length: tokenCount }, () => '')
  }

  return {
    initializeTokenValues,
    authHeaders,
    authQuery,
    tokenValues,
  }
}
