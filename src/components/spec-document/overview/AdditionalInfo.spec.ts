import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdditionalInfo from './AdditionalInfo.vue'

describe('<AdditionalInfo />', () => {
  it('renders correctly with all props present', () => {
    const contact = {
      name: 'sample name',
      url: 'https://localhost.io/contact',
      email: 'email@localhost.io',
    }
    const license = {
      name: 'sample license',
      url: 'https://localhost.io/license',
    }
    const externalDocs = {
      description: 'sample external docs',
      url: 'https://localhost.io/external-docs',
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

  it('does not render unsafe external docs hrefs', () => {
    const wrapper = mount(AdditionalInfo, {
      props: {
        externalDocs: {
          description: 'sample external docs',
          url: 'javascript:alert(1)',
        },
      },
    })

    expect(wrapper.findTestId('overview-additional-info').exists()).toBe(false)
  })

  it('renders unsafe license URLs as plain text', () => {
    const wrapper = mount(AdditionalInfo, {
      props: {
        license: {
          name: 'sample license',
          url: 'javascript:alert(1)',
        },
      },
    })

    const license = wrapper.findTestId('overview-additional-info-license')

    expect(license.element).instanceOf(HTMLParagraphElement)
    expect(license.attributes('href')).toBeUndefined()
  })

  it('renders malformed contact emails as plain text', () => {
    const wrapper = mount(AdditionalInfo, {
      props: {
        contact: {
          email: 'email@example.com?subject=Injected',
        },
      },
    })

    const contact = wrapper.findTestId('overview-additional-info-contact')

    expect(contact.text()).toContain('(email@example.com?subject=Injected)')
    expect(contact.find('a').exists()).toBe(false)
  })
})
