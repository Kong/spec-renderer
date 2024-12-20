import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResponseSample from './ResponseSample.vue'
import type { IMediaTypeContent } from '@stoplight/types'
import { CODE_INDENT_SPACES } from '@/constants'

describe('<ResponseSample />', () => {
  it('renders with a single example', () => {
    const exampleValue = { name: 'John Doe' }

    const contentList: IMediaTypeContent[] = [
      {
        id: 'sample-content-1',
        mediaType: 'application/json',
        examples: [
          {
            id: 'example1',
            key: 'example1',
            value: exampleValue,
          },
        ],
      },
    ]

    const wrapper = mount(ResponseSample, {
      props: {
        contentList,
        responseCode: '200',
        contentType: 'application/json',
      },
    })

    expect(wrapper.findTestId('response-sample').exists()).toBe(true)
    // response selector is not rendered
    expect(wrapper.findTestId('response-sample-selector').exists()).toBe(false)
    // activeResponseSample is the example value
    // @ts-expect-error activeResponseSample exists as a computed property
    expect(wrapper.vm.activeResponseSample).toEqual(JSON.stringify(exampleValue, null, CODE_INDENT_SPACES))
  })

  it('renders with multiple examples', async () => {

    const exampleValueList = [{ name: 'John Doe' }, { name: 'Jane Doe' }]

    const contentList: IMediaTypeContent[] = [
      {
        id: 'sample-content-1',
        mediaType: 'application/json',
        examples: [
          {
            id: 'example1',
            key: 'example1',
            value: exampleValueList[0],
          },
          {
            id: 'example2',
            key: 'example2',
            value: exampleValueList[1],
          },
        ],
      },
    ]

    const wrapper = mount(ResponseSample, {
      props: {
        contentList,
        responseCode: '200',
        contentType: 'application/json',
      },
    })

    expect(wrapper.findTestId('response-sample').exists()).toBe(true)
    // response selector is rendered since there are multiple examples
    expect(wrapper.findTestId('response-sample-selector').exists()).toBe(true)

    // activeResponseSample is the first example value
    // @ts-expect-error activeResponseSample exists as a computed property
    expect(wrapper.vm.activeResponseSample).toEqual(JSON.stringify(exampleValueList[0], null, CODE_INDENT_SPACES))
  })

  it('falls back to description when contentList is empty', () => {
    const wrapper = mount(ResponseSample, {
      props: {
        contentList: [],
        responseCode: '200',
        contentType: 'application/json',
        description: 'This is a fallback description',
      },
    })

    expect(wrapper.findTestId('response-sample').exists()).toBe(true)
    // response selector is not rendered
    expect(wrapper.findTestId('response-sample-selector').exists()).toBe(false)
    // @ts-expect-error activeResponseSample exists as a computed property
    expect(wrapper.vm.activeResponseSample).toBe('This is a fallback description')
  })
})
