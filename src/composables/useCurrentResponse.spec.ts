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
    } = useCurrentResponse(responseList)

    it('should return the list of response codes', () => {
      expect(responseCodeList.value).toEqual([
        {
          value: '200',
          label: '200',
          key: '2xx',
        },
        {
          value: '400',
          label: '400',
          key: '4xx',
        },
      ])
    })
    it('should return the first response code as the default', () => {
      expect(activeResponseCode.value).toBe('200')
    })
    it('should return the response object for the active response code', () => {
      expect(activeResponse.value).toEqual(responseList.value[0])
    })
  })

  describe('active content type', () => {
    const {
      activeContentType,
      contentTypeList,
      activeResponseContentList,
    } = useCurrentResponse(responseList)

    it('should return the list of content types', () => {
      expect(contentTypeList.value).toEqual([
        {
          value: 'application/json',
          label: 'application/json',
          key: 'application-json',
        },
        {
          value: 'application/xml',
          label: 'application/xml',
          key: 'application-xml',
        },
      ])
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
  })
})
