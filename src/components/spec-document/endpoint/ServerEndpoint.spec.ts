import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ServerEndpoint from './ServerEndpoint.vue'

describe('<ServerEndpoint />', () => {
  describe('for multiple servers', () => {

    const serverUrlList = ['https://global.api.konghq.com/v2', 'https://us.api.konghq.com/v2']
    const selectedServerUrl = serverUrlList[1]
    const path = '/sample-path'
    const wrapper = mount(ServerEndpoint, {
      props: {
        method: 'get',
        path,
        selectedServerUrl,
        serverUrlList,
      },
      attachTo: document.body, // required for any interaction with the DOM to work
    })

    const select = wrapper.findTestId(`server-dropdown-get-${serverUrlList[0]}${path}`)

    it('renders correctly with all required props', () => {
      // the component itself is rendered
      expect(wrapper.findTestId('server-endpoint').exists()).toBe(true)

      // the selected URL and path are correctly rendered
      expect(select.element.innerHTML).toContain(selectedServerUrl)
      expect(wrapper.findTestId('endpoint-path').text()).toBe(path)


      // the list of URLs is correctly rendered
      for (const serverUrl of serverUrlList) {
        expect(wrapper.findTestId(`${serverUrl}-item`).exists()).toBe(true)
        expect(wrapper.findTestId(`${serverUrl}-item`).isVisible()).toBe(false)
      }
    })

    it('emits an event when a new server URL is selected', async () => {
      // initial value was the second item in serverUrlList array
      // updating it to the first item should trigger emit
      expect(wrapper.findTestId(`${serverUrlList[0]}-item`).isVisible()).toBe(false)

      await wrapper.findTestId('trigger-button').trigger('click')

      expect(wrapper.findTestId(`${serverUrlList[0]}-item`).isVisible()).toBe(true)
      await wrapper.findTestId(`${serverUrlList[0]}-item-trigger`).trigger('click')

      expect(wrapper.emitted('selected-server-changed')?.toString()).toBe(serverUrlList[0])
    })
  })

  describe('for single server', () => {
    const serverUrl = 'https://global.api.konghq.com/v2'
    const path = '/sample-path'

    const props = {
      method: 'get',
      path,
      selectedServerUrl: serverUrl,
      serverUrlList: [serverUrl],
    }
    const wrapper = mount(ServerEndpoint, { props })

    it('renders correctly with all required props', () => {
      // the component itself is rendered
      expect(wrapper.findTestId('server-endpoint').exists()).toBe(true)

      // the selected URL and path are correctly rendered
      const testId = `server-url-${props.method}-${props.serverUrlList[0]}${props.path}`
      expect(wrapper.findTestId(testId).text()).toBe(`${serverUrl}${path}`)
    })
  })
})
