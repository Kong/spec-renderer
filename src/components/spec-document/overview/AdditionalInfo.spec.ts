import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdditionalInfo from './AdditionalInfo.vue'

describe('<AdditionalInfo />', () => {
  it('renders correctly with all props present', () => {
    const contact = {
      name: 'sample name',
      url: 'https://stoplight.io/contact',
      email: 'email@stoplight.io',
    }
    const license = {
      name: 'sample license',
      url: 'https://stoplight.io/license',
    }
    const externalDocs = {
      description: 'sample external docs',
      url: 'https://stoplight.io/external-docs',
    }

    const wrapper = mount(AdditionalInfo, {
      props: {
        contact,
        license,
        externalDocs,
      },
    })

    // the component itself is rendered
    expect(wrapper.findTestId('overview-additional-info').exists()).toBe(true)

    // since license URL is present, it should render as anchor tag
    expect(wrapper.findTestId('overview-additional-info-license').element).instanceOf(HTMLAnchorElement)

    // all values should be present in rendered component, as text or as href
    const textToRender = [...Object.values({ ...contact, ...license, ...externalDocs })]
    for (const text of textToRender) {
      expect(wrapper.html()).toContain(text)
    }
  })

  it('renders license as p tag when URL is not present', () => {
    const license = {
      name: 'sample license',
    }

    const wrapper = mount(AdditionalInfo, {
      props: {
        license,
      },
    })

    // the component itself is rendered
    expect(wrapper.findTestId('overview-additional-info').exists()).toBe(true)

    // since license URL is not present, it should render as p tag
    expect(wrapper.findTestId('overview-additional-info-license').element).instanceOf(HTMLParagraphElement)
  })
})
