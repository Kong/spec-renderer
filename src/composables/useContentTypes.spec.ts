import { describe, it, expect } from 'vitest'
import { computed } from 'vue'
import type { IMediaTypeContent } from '@stoplight/types'
import useContentTypes from './useContentTypes'

describe('useContentTypes', () => {
  const makeContent = (mediaType: string): IMediaTypeContent => ({
    id: mediaType,
    mediaType,
    examples: [],
    encodings: [],
    schema: {
      type: 'object',
      properties: {},
    },
  })

  it('should set activeContentType to the first content type', () => {
    const contentList = computed<IMediaTypeContent[]>(() => [
      makeContent('application/json'),
      makeContent('application/xml'),
    ])

    const { activeContentType } = useContentTypes(contentList)
    expect(activeContentType.value).toBe('application/json')
  })

  it('should return empty string when contentList is empty', () => {
    const contentList = computed<IMediaTypeContent[]>(() => [])
    const { activeContentType } = useContentTypes(contentList)
    expect(activeContentType.value).toBe('')
  })

  it('should return the full content list when only one content type is present', () => {
    const contents = [makeContent('application/json')]
    const contentList = computed<IMediaTypeContent[]>(() => contents)

    const { activeResponseContentList } = useContentTypes(contentList)
    expect(activeResponseContentList.value).toEqual(contents)
  })

  it('should filter activeResponseContentList by activeContentType when multiple types exist', () => {
    const jsonContent = makeContent('application/json')
    const xmlContent = makeContent('application/xml')
    const contentList = computed<IMediaTypeContent[]>(() => [jsonContent, xmlContent])

    const { activeContentType, activeResponseContentList } = useContentTypes(contentList)

    activeContentType.value = 'application/xml'
    expect(activeResponseContentList.value).toEqual([xmlContent])
  })
})
