import { computed, ref, watch, type ComputedRef } from 'vue'
import type { IHttpOperationResponse } from '@stoplight/types'

export default function useResponseCode(responseList: ComputedRef<Array<IHttpOperationResponse>>) {

  const responseCodeList = computed(() => responseList.value?.map(response => response.code) ?? [])
  const activeResponseCode = ref<string>(responseCodeList.value[0])
  const activeResponse = computed(() => responseList.value?.find(response => response.code === activeResponseCode.value))

  // update active response code when default response code changes
  // this will happen when a new endpoint page is opened
  watch(responseCodeList, (newResponseCodeList) => {
    activeResponseCode.value = newResponseCodeList[0]
  })

  function handleResponseCodeChanged(event: Event) {
    const code = (event.target as HTMLSelectElement).value
    activeResponseCode.value = code
  }

  return {
    responseCodeList,
    activeResponseCode,
    activeResponse,
    handleResponseCodeChanged,
  }
}