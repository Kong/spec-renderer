import { reactive, toRefs } from 'vue'

interface AuthTokenState {
  tokenValues: Array<string>
}

const state: AuthTokenState = reactive({
  tokenValues: [],
})

export default function useAuthTokenState() {
  const { tokenValues } = toRefs(state)

  const initializeTokenValues = (tokenCount = 0) => {
    state.tokenValues = Array.from({ length: tokenCount }, () => '')
  }

  return {
    initializeTokenValues,
    tokenValues,
  }
}
