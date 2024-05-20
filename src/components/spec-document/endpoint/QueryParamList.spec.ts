import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QueryParamList from './QueryParamList.vue'
import { HttpParamStyles } from '@stoplight/types'

describe('<QueryParamList />', () => {
  const wrapper = mount(QueryParamList, {
    props: {
      queryParamList: [
        {
          name: 'query1',
          id: 'query1',
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
          name: 'query2',
          id: 'query2',
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
    },
  })

  const componentList = [
    // the component itself is rendered
    'endpoint-query-param-list',
    // the model property component renders for both query params
    'model-property-query1',
    'model-property-query2',
  ]

  for (const component of componentList) {
    it(`renders ${component} correctly`, () => {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    })
  }
})
