import { computed, ref, watch, type ComputedRef } from 'vue'
import type { IHttpOperationResponse } from '@stoplight/types'
import { ResponseSelectComponent } from '@/types'
import { getSampleBody } from '@/utils'

export default function useResponseCode(responseList: ComputedRef<Array<IHttpOperationResponse>>) {
  // returns hundreds of response codes, e.g. 200 -> 2xx, 401 -> 4xx
  const getResponseCodeKey = (code: string) => code[0] + 'xx'
  // returns content type key, e.g. 'application/json' -> 'application-json'
  const getContentTypeKey = (contentType: string) => contentType.replace('/', '-')

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

  // compute the list of content types for the active response. Used to populate the content-type select dropdown
  // e.g. ['application/json', 'application/xml']
  const contentTypeList = computed(() => activeResponse.value?.contents?.map(content => {
    return { value: content.mediaType, label: content.mediaType, key: getContentTypeKey(content.mediaType) }
  }) ?? [])
  // ref to store the content type for whose response is shown
  // use the first content type as the default
  const activeContentType = ref<string>(contentTypeList.value[0]?.value)
  // compute the content list based on the active content type, to be used in HttpResponse
  const activeResponseContentList = computed(() => {
    // If only single content type present, return response contents as it is
    if (contentTypeList.value.length < 2) return activeResponse.value?.contents

    return activeResponse.value?.contents?.filter(content => content.mediaType === activeContentType.value)
  })

  const activeReponseSampleIdx = ref(0)
  const activeResponseSample = computed(() => {
    if (activeResponseContentList.value?.length) {
      return getSampleBody(
        activeResponseContentList.value,
        {},
        activeReponseSampleIdx.value,
      )
    }
    return undefined
  })


  const responseSelectComponentList = computed(() => {
    const componentList = [{
      name: ResponseSelectComponent.ResponseCodeSelectMenu,
      value: activeResponseCode.value,
      optionList: responseCodeList.value,
    }]

    if (contentTypeList.value.length > 1) {
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

  return {
    responseCodeList,
    activeResponseCode,
    activeResponse,
    activeResponseDescription,
    activeContentType,
    activeReponseSampleIdx,
    activeResponseSample,
    contentTypeList,
    activeResponseContentList,
    responseSelectComponentList,
  }
}
