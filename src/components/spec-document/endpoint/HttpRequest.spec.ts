import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { HttpParamStyles } from '@stoplight/types'
import HttpRequest from './HttpRequest.vue'
import type { IHttpOperationRequestBody, IHttpPathParam, IHttpQueryParam } from '@stoplight/types'

describe('<HttpRequest />', () => {

  const query: IHttpQueryParam[] = [
    {
      name: 'query1',
      id: 'query1',
      style: HttpParamStyles.Form,
    },
    {
      name: 'query2',
      id: 'query2',
      style: HttpParamStyles.SpaceDelimited,
    },
  ]
  const path: IHttpPathParam[] = [
    {
      name: 'path1',
      id: 'path1',
      style: HttpParamStyles.Simple,
    },
    {
      name: 'path2',
      id: 'path2',
      style: HttpParamStyles.Label,
    },
  ]
  const body: IHttpOperationRequestBody = {
    id: 'sample-body',
    contents: [
      {
        id: 'a1e3r4',
        mediaType: 'application/json',
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
  }

  const wrapper = mount(HttpRequest, {
    props: {
      query,
      path,
      body,
    },
  })

  const componentList = [
    // the component itself is rendered
    'endpoint-http-request',
    // the child componentes are rendered
    'endpoint-path-param-list',
    'endpoint-query-param-list',
    'endpoint-body-content-list',
  ]

  for (const component of componentList) {
    it(`renders ${component} correctly`, () => {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    })
  }
})
