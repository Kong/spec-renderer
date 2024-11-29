import { computed, ref, watch, type ComputedRef } from 'vue'
import type { IHttpOperationResponse } from '@stoplight/types'
import { ResponseSelectComponent } from '@/types'
import type { SelectComponentListItem } from '@/types'
import { getResponseCodeKey } from '@/utils/response'
import useContentTypes from './useContentTypes'

export default function useResponseCode(responseList: ComputedRef<Array<IHttpOperationResponse>>) {
  // from the list of responses, get the list of response codes. Used to populate the response code select dropdown
  const responseCodeList = computed(() => responseList.value?.map(response => {
    return { value: response.code, label: response.code, key: getResponseCodeKey(response.code) }
  }) ?? [])
  // ref to store the status code whose response is to be shown
  // use the first response code as the default
  const activeResponseCode = ref<string>(responseCodeList.value[0]?.value)
  // compute the response object for the active response code
  const activeResponse = computed(() => responseList.value?.find(response => response.code === activeResponseCode.value))
  const activeResponseDescription = computed(() => activeResponse.value?.description ?? '')

  const responseContents = computed(() => activeResponse.value?.contents ?? [])
  const { activeContentType, activeResponseContentList, contentTypeList } = useContentTypes(responseContents)

  const responseSelectComponentList = computed((): Array<SelectComponentListItem> => {
    const componentList = [{
      name: ResponseSelectComponent.ResponseCodeSelectMenu,
      value: activeResponseCode.value,
      optionList: responseCodeList.value,
    }]

    if (contentTypeList.value.length > 0) {
      componentList.push({
        name: ResponseSelectComponent.ContentTypeSelectMenu,
        value: activeContentType.value,
        optionList: contentTypeList.value,
      })
    }

    return componentList
  })

  // reset default value of active response code and content-type when list of response code changes
  // this will happen when a new endpoint page is opened
  watch(responseCodeList, (newResponseCodeList) => {
    activeResponseCode.value = newResponseCodeList[0]?.value
    activeContentType.value = contentTypeList.value[0]?.value
  })

  watch(activeResponseCode, () => {
    activeContentType.value = contentTypeList.value[0]?.value
  })

  return {
    responseCodeList,
    activeResponseCode,
    activeResponse,
    activeResponseDescription,
    activeContentType,
    contentTypeList,
    activeResponseContentList,
    responseSelectComponentList,
  }
}
