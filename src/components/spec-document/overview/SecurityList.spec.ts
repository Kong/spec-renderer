import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SecurityList from './SecurityList.vue'

describe('<SecurityList />', () => {
  it('renders', () => {
    const wrapper = mount(SecurityList, {
      props: {
        securitySchemeList: [
          {
            id: 'sample-security-scheme-id',
            key: 'sample-security-scheme-key',
            type: 'apiKey',
            name: 'sample-security-scheme-name',
            description: 'sample-security-scheme-description',
            in: 'header',
          },
          {
            id: 'sample-security-scheme-id-2',
            key: 'sample-security-scheme-key-2',
            description: 'sample-security-scheme-description-2',
            type: 'http',
            scheme: 'basic',
          },
        ],
      },
    })

    // the component itself is rendered
    expect(wrapper.findTestId('overview-security-list').exists()).toBe(true)

    // ——— the component renders both security schemes ———
    const schemeIdList = ['sample-security-scheme-id', 'sample-security-scheme-id-2']
    for (const schemeId of schemeIdList) {
      expect(wrapper.findTestId(`overview-security-scheme-${schemeId}`).exists()).toBe(true)
    }
  })
})
