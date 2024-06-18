import { describe, it, expect } from 'vitest'
import useCurrentResponse from './useCurrentResponse'
import { computed } from 'vue'
import type { IHttpOperationResponse } from '@stoplight/types'

describe('useCurrentResponse', () => {
  const responseList = computed<Array<IHttpOperationResponse>>(() => [
    {
      id: 'sample-response-1',
      code: '200',
      contents: [
        {
          id: 'sample-content-1',
          mediaType: 'application/json',
        },
        {
          id: 'sample-content-2',
          mediaType: 'application/xml',
        },
      ],
    },
    {
      id: 'sample-response-2',
      code: '400',
      contents: [
        {
          id: 'sample-content-3',
          mediaType: 'application/xml',
        },
        {
          id: 'sample-content-4',
          mediaType: 'application/json',
        },
      ],
    },
  ])

  describe('active response code', () => {
    const {
      responseCodeList,
      activeResponseCode,
      activeResponse,
      handleResponseCodeChanged,
    } = useCurrentResponse(responseList)

    it('should return the list of response codes', () => {
      expect(responseCodeList.value).toEqual(['200', '400'])
    })
    it('should return the first response code as the default', () => {
      expect(activeResponseCode.value).toBe('200')
    })
    it('should return the response object for the active response code', () => {
      expect(activeResponse.value).toEqual(responseList.value[0])
    })
    it('should update the active response code when a new response code is selected', () => {
      const mockEvent = {
        target: {
          value: '400',
        },
      } as unknown as Event

      handleResponseCodeChanged(mockEvent)

      // the new active response code is 400
      expect(activeResponseCode.value).toBe('400')
      // the new active response is the second response in the list
      expect(activeResponse.value).toEqual(responseList.value[1])
    })
  })

  describe('active content type', () => {
    const {
      activeContentType,
      contentTypeList,
      activeResponseContentList,
      handleContentTypeChanged,
    } = useCurrentResponse(responseList)

    it('should return the list of content types', () => {
      expect(contentTypeList.value).toEqual(['application/json', 'application/xml'])
    })
    it('should return the first content type as the default', () => {
      expect(activeContentType.value).toBe('application/json')
    })
    it('should return the content list for the active content type', () => {
      expect(activeResponseContentList.value).toEqual([
        {
          id: 'sample-content-1',
          mediaType: 'application/json',
        },
      ])
    })
    it('should update the active content type when a new content type is selected', () => {
      const mockEvent = {
        target: {
          value: 'application/xml',
        },
      } as unknown as Event

      handleContentTypeChanged(mockEvent)

      // the new active content type is application/json
      expect(activeContentType.value).toBe('application/xml')
      // the new active response content list is filtered to only include the selected content type
      expect(activeResponseContentList.value).toEqual([
        {
          id: 'sample-content-2',
          mediaType: 'application/xml',
        },
      ])
    })
  })
})
