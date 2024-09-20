import { ref } from 'vue'

const selectedTryItMethodKey = ref<string>('browser')

export default function useTryItState() {
  return {
    selectedTryItMethodKey,
  }
}
