import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TryItParams from './TryItParams.vue'
import type { RequestParamTypes } from '@/types'


describe('<TryItParams />', () => {
  const exampleValues = {
    pageNumber: 1,
    pageSize: 10,
    productId: 'd32d905a-ed33-46a3-a093-d8f536af9a8a',
    versionId: '9f5061ce-78f6-4452-9108-ad7c02821fd5',
    header: 'my-custom-header-value',
  }

  const testData = {
    props: {
      paramType: <RequestParamTypes>'path',
      data: {
        id: '123',
        method: 'get',
        path: '/api-products/{apiProductId}/product-versions/{id}',
        responses: [],
        servers: [
          {
            id: 'sample-server-id',
            url: '{protocol}://{hostname}/v2',
          },
        ],
        request: {
          path: [
            {
              name: 'apiProductId',
              description: 'The API product identifier',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid',
                examples: [exampleValues.productId],
              },
            },
            {
              name: 'id',
              description: 'The API product version identifier',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid',
                examples: [exampleValues.versionId],
              },
            },
          ],
          query: [
            {
              name: 'page[size]',
              style: 'form',
              examples: [],
              description:
                'The maximum number of items to include per page. The last page of a collection may include fewer items.',
              required: false,
              allowEmptyValue: true,
              schema: {
                type: 'integer',
                examples: [exampleValues.pageSize],
              },
            },
            {
              name: 'page[number]',
              style: 'form',
              examples: [],
              description: 'Determines which page of the entities to retrieve.',
              required: false,
              allowEmptyValue: true,
              schema: {
                type: 'integer',
                examples: [exampleValues.pageNumber],
              },
            },
          ],
          headers: [
            {
              name: 'client',
              style: 'simple',
              examples: [],
              description: 'Optional custom header for client identification or debugging.',
              required: false,
              schema: {
                type: 'string',
                examples: [exampleValues.header],
              },
            },
          ],
        },
      },
    },
  }

  describe('path parameters', () => {
    it('Should path parameters', async () => {
      testData.props.paramType = 'path'

      const wrapper = mount(TryItParams, testData)
      const field = wrapper.findTestId('tryit-path-param-id-123')
      expect(field.exists()).toBe(true)
    })

    it('Should emit an event when path parameter is changed', async () => {
      testData.props.paramType = 'path'
      const wrapper = mount(TryItParams, testData)

      const field = wrapper.findTestId('tryit-path-param-apiProductId-123')

      // test changing the path parameter
      const newProductId = 'xxx-yyy-zzz'
      await field.setValue(newProductId)
      // check if the new path is emitted
      const expectedPath = `/api-products/${newProductId}/product-versions/${exampleValues.versionId}`
      expect(wrapper.emitted('request-path-changed')).toEqual([[expectedPath]])
    })
  })

  describe('query parameters', () => {
    it('Should show path parameters', async () => {
      testData.props.paramType = 'query'

      const wrapper = mount(TryItParams, testData)
      const field = wrapper.findTestId('tryit-query-param-page[size]-123')
      expect(field.exists()).toBe(true)
    })

    it('Should emit an event when query parameter is changed', async () => {
      testData.props.paramType = 'query'
      const wrapper = mount(TryItParams, testData)
      const field = wrapper.findTestId('tryit-query-param-page[number]-123')

      // test changing the page number query parameter
      const newPageNumber = 4
      // update page number query parameter
      await field.setValue(newPageNumber)
      // check if the new query is emitted
      const expectedQuery = `page%5Bsize%5D=${exampleValues.pageSize}&page%5Bnumber%5D=${newPageNumber}`
      expect(wrapper.emitted('request-query-changed')).toEqual([[expectedQuery]])
    })
  })

  describe('header parameters', () => {
    it('Should show header parameters', async () => {
      testData.props.paramType = 'headers'

      const wrapper = mount(TryItParams, testData)
      const field = wrapper.findTestId('tryit-headers-param-client-123')
      expect(field.exists()).toBe(true)
    })

    it('Should emit an event when header parameter is changed', async () => {
      testData.props.paramType = 'headers'
      const wrapper = mount(TryItParams, testData)
      const field = wrapper.findTestId('tryit-headers-param-client-123')

      // test changing the header parameter
      const newHeaderValue = 'new-header-value'
      await field.setValue(newHeaderValue)

      // check if the new header is emitted
      const expectedHeader = [
        {
          'name': 'client', // header name
          'value': newHeaderValue, // updated value
        },
      ]
      expect(wrapper.emitted('request-headers-changed')).toEqual([[expectedHeader]])
    })
  })
})
