import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TryItParams from './TryItParams.vue'
import type { RequestParamTypes } from '@/types'


describe('<TryItParams />', () => {
  const testData = {
    props: {
      paramType: <RequestParamTypes>'path',
      data: {
        id: '123',
        method: 'get',
        path: '/api-products/{apiProductId}/product-versions/{id}',
        responses: [],
        servers: [{
          id: 'sample-server-id',
          url: '{protocol}://{hostname}/v2',
        }],
        request: {
          path: [
            {
              'name': 'apiProductId',
              'description': 'The API product identifier',
              'required': true,
              'schema': {
                'type': 'string',
                'format': 'uuid',
                'examples': [
                  'd32d905a-ed33-46a3-a093-d8f536af9a8a',
                ],
              },
            },
            {
              'name': 'id',
              'description': 'The API product version identifier',
              'required': true,
              'schema': {
                'type': 'string',
                'format': 'uuid',
                'examples': [
                  '9f5061ce-78f6-4452-9108-ad7c02821fd5',
                ],
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

      const wrapper = mount(TryItParams, testData )
      const field = wrapper.findTestId('tryit-path-param-id-123')
      expect(field.exists()).toBe(true)
    })

    it('Should emit an event when path parameter is changed', async () => {
      const wrapper = mount(TryItParams, testData)

      const field = wrapper.findTestId('tryit-path-param-apiProductId-123')
      await field.setValue('xxx-yyy-zzz')
      expect(wrapper.emitted('request-path-changed')?.toString()).toBe('/api-products/xxx-yyy-zzz/product-versions/9f5061ce-78f6-4452-9108-ad7c02821fd5')
    })
  })
})
