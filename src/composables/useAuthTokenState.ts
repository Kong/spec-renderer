import { ref } from 'vue'

const tokenValueMap = ref<Record<string, string>>({})
const authHeaderMap = ref<Record<string, Array<Record<string, string>>>>({})
const authQueryMap = ref<Record<string, string>>({})

export default function useAuthTokenState() {
  return {
    tokenValueMap,
    authHeaderMap,
    authQueryMap,
  }
}
