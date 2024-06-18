import { computed, ref, watch, type ComputedRef } from 'vue'
import type { IHttpOperationResponse } from '@stoplight/types'
import { ResponseSelectComponent } from '@/types'

export default function useResponseCode(responseList: ComputedRef<Array<IHttpOperationResponse>>) {

  // from the list of responses, get the list of response codes. Used to populate the response code select dropdown
  const responseCodeList = computed(() => responseList.value?.map(response => response.code) ?? [])
  // ref to store the status code whose response is to be shown
  // use the first response code as the default
  const activeResponseCode = ref<string>(responseCodeList.value[0])
  // compute the response object for the active response code
  const activeResponse = computed(() => responseList.value?.find(response => response.code === activeResponseCode.value))

  // compute the list of content types for the active response. Used to populate the content-type select dropdown
  // e.g. ['application/json', 'application/xml']
  const contentTypeList = computed(() => activeResponse.value?.contents?.map(content => content.mediaType) ?? [])
  // ref to store the content type for whose response is shown
  // use the first content type as the default
  const activeContentType = ref<string>(contentTypeList.value[0])
  // compute the content list based on the active content type, to be used in HttpResponse
  const activeResponseContentList = computed(() => {
    // If only single content type present, return response contents as it is
    if (contentTypeList.value.length < 2) return activeResponse.value?.contents

    return activeResponse.value?.contents?.filter(content => content.mediaType === activeContentType.value)
  })


  const responseSelectComponentList = computed(()=> {
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
    activeResponseCode.value = newResponseCodeList[0]
    activeContentType.value = contentTypeList.value[0]
  })

  function handleSelectInputChange(event: Event, componentName: ResponseSelectComponent) {
    const newValue = (event.target as HTMLSelectElement).value
    if (componentName === ResponseSelectComponent.ResponseCodeSelectMenu) {
      activeResponseCode.value = newValue
    } else if (componentName === ResponseSelectComponent.ContentTypeSelectMenu) {
      activeContentType.value = newValue
    }
  }

  return {
    responseCodeList,
    activeResponseCode,
    activeResponse,
    activeContentType,
    contentTypeList,
    activeResponseContentList,
    responseSelectComponentList,
    handleSelectInputChange,
  }
}
