import { computed, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import type { IHttpCallbackOperation } from '@stoplight/types'
import { getSampleBody } from '@/utils/request-data'
import useCurrentResponse from './useCurrentResponse'

export default function useCurrentCallback(callbackList: ComputedRef<IHttpCallbackOperation[]>) {
  const activeCallbackKey = ref<string>(callbackList.value[0]?.key ?? '')

  const callbackKeyList = computed(() => callbackList.value.map(callback => {
    return { value: callback.key, label: callback.key, key: callback.method }
  }) ?? [])

  const activeCallback = computed(() => callbackList.value.find(callback => callback.key === activeCallbackKey.value))

  const activeCallbackRequestSample = computed(() => {
    return activeCallback.value?.request?.body?.contents
      ? getSampleBody(
        activeCallback.value.request.body.contents,
        { excludeReadonly: true, excludeNotRequired: false },
        0,
      )
      : ''
  })

  const activeCallbackResponseList = computed(() => activeCallback.value?.responses ?? [])

  // maintain state for response list of active callback
  const {
    activeResponseDescription: activeCallbackResponseDescription,
    activeResponseCode: activeCallbackResponseCode,
    activeContentType: activeCallbackContentType,
    activeResponseContentList: activeCallbackResponseContentList,
    responseSelectComponentList: activeCallbackResponseSelectComponentList,
  } = useCurrentResponse(activeCallbackResponseList)

  // reset default value of active callback key when list of callback key changes
  watch(callbackKeyList, (newCallbackKeyList) => {
    activeCallbackKey.value = newCallbackKeyList[0]?.value ?? ''
  })

  return {
    activeCallbackKey,
    callbackKeyList,
    activeCallback,
    activeCallbackRequestSample,
    activeCallbackResponseDescription,
    activeCallbackResponseCode,
    activeCallbackContentType,
    activeCallbackResponseContentList,
    activeCallbackResponseSelectComponentList,
  }
}
