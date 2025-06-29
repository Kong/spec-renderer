import { computed, ref, unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { IMediaTypeContent } from '@stoplight/types'
import { ResponseSelectComponent } from '@/types'

/**
 * Composable to manage active content type for a list of contents
 *
 * @param inputContentList — List of contents. Can be a ref or a plain array
 */
export default function useContentTypes(inputContentList: MaybeRef<IMediaTypeContent[]>) {
  // returns content type key, e.g. 'application/json' -> 'application-json'
  const getContentTypeKey = (contentType: string) => contentType.replace('/', '-')

  // compute the list of contents, since inputContentList can be a ref or a plain array
  const contentList = computed(() => unref(inputContentList))

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
