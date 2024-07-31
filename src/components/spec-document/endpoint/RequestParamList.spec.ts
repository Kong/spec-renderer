import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RequestParamList from './RequestParamList.vue'
import { HttpParamStyles } from '@stoplight/types'

describe('<RequestParamList />', () => {
  const wrapper = mount(RequestParamList, {
    props: {
      paramList: [
        {
          name: 'param1',
          id: 'param1',
          style: HttpParamStyles.Form,
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
        },
        {
          name: 'param2',
          id: 'param2',
          style: HttpParamStyles.SpaceDelimited,
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
        },
      ],
      title: 'sample-title',
    },
    attrs: {
      'data-testid': 'endpoint-request-param-list',
    },
  })

  const componentList = [
    // the component itself is rendered
    'endpoint-request-param-list',
    // the model property component renders for both request params
    'model-property-param1',
    'model-property-param2',
  ] as const

  for (const component of componentList) {
    it(`renders ${component} correctly`, () => {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    })
  }
})
