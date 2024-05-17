import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PathParamList from './PathParamList.vue'
import { HttpParamStyles } from '@stoplight/types'

describe('<PathParamList />', () => {
  const wrapper = mount(PathParamList, {
    props: {
      pathParamList: [
        {
          name: 'path1',
          id: 'path1',
          style: HttpParamStyles.Simple,
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
          name: 'path2',
          id: 'path2',
          style: HttpParamStyles.Label,
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

  expect(wrapper.findTestId('endpoint-path-param-list').exists()).toBe(true)

  const componentList = [
    // the component itself is rendered
    'endpoint-path-param-list',
    // the model property component renders for both path params
    'model-property-path1',
    'model-property-path2',
  ]

  for (const component of componentList) {
    it(`renders ${component} correctly`, () => {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    })
  }
})
