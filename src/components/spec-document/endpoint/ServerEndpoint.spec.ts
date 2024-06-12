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
    })
    const select = wrapper.findTestId<'select'>('select-dropdown')

    it('renders correctly with all required props', () => {
    // the component itself is rendered
      expect(wrapper.findTestId('server-endpoint').exists()).toBe(true)

      // the selected URL and path are correctly rendered
      expect(select.element.value).toBe(selectedServerUrl)
      expect(wrapper.findTestId('endpoint-path').text()).toBe(path)


      // the list of URLs is correctly rendered
      for (const serverUrl of serverUrlList) {
        expect(wrapper.findTestId(`select-dropdown-option-${serverUrl}`).exists()).toBe(true)
      }
    })

    it('emits an event when a new server URL is selected', async () => {
    // initial value was the second item in serverUrlList array
    // updating it to the first item should trigger emit
      await select.setValue(serverUrlList[0])
      expect(wrapper.emitted('selected-server-changed')?.toString()).toBe(serverUrlList[0])
    })
  })

  describe('for single server', () => {
    const serverUrl = 'https://global.api.konghq.com/v2'
    const path = '/sample-path'
    const wrapper = mount(ServerEndpoint, {
      props: {
        method: 'get',
        path,
        selectedServerUrl: serverUrl,
        serverUrlList: [serverUrl],
      },
    })

    it('renders correctly with all required props', () => {
      // the component itself is rendered
      expect(wrapper.findTestId('server-endpoint').exists()).toBe(true)

      // the selected URL and path are correctly rendered
      expect(wrapper.findTestId('server-url-with-path').text()).toBe(`${serverUrl}${path}`)
    })
  })
})
