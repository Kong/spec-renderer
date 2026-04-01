import { computed, ref } from 'vue'
import type { ComputedRef } from 'vue'
import type { IMediaTypeContent } from '@stoplight/types'
import { ResponseSelectComponent } from '@/types'

/**
 * Composable to manage active content type for a list of contents
 *
 * @param contentList — List of contents. Will always be a computed property to maintain reactivity.
 */
export default function useContentTypes(contentList: ComputedRef<IMediaTypeContent[]>) {
  // returns content type key, e.g. 'application/json' -> 'application-json'
  const getContentTypeKey = (contentType: string) => contentType.replace('/', '-')

  // compute the list of content types for the active response. Used to populate the content-type select dropdown
  // e.g. ['application/json', 'application/xml']
  const contentTypeList = computed(() => contentList.value.map(content => {
    return { value: content.mediaType, label: content.mediaType, key: getContentTypeKey(content.mediaType) }
  }) ?? [])

  // ref to store the content type for whose response is shown
  // use the first content type as the default
  const activeContentType = ref<string>(contentTypeList.value[0]?.value ?? '')

  // compute the content list based on the active content type, to be used in HttpOperationBody
  const activeResponseContentList = computed(() => {
    // If only single content type present, return response contents as it is
    if (contentTypeList.value.length < 2) return contentList.value

    return contentList.value.filter(content => content.mediaType === activeContentType.value) ?? []
  })

  const contentSelectComponentList = computed(() => {
    return [{
      name: ResponseSelectComponent.ContentTypeSelectMenu,
      value: activeContentType.value,
      optionList: contentTypeList.value,
    }]
  })

  return {
    contentTypeList,
    activeContentType,
    activeResponseContentList,
    contentSelectComponentList,
  }
}
