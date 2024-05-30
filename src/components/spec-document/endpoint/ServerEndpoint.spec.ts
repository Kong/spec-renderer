import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ServerEndpoint from './ServerEndpoint.vue'

describe('<ServerEndpoint />', () => {
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
  const select = wrapper.findTestId<'select'>('endpoint-server-select')

  it('renders', () => {
    // the component itself is rendered
    expect(wrapper.findTestId('server-endpoint').exists()).toBe(true)

    // the selected URL with path is correctly rendered
    expect(wrapper.findTestId('server-endpoint-url-with-path').text()).toBe(`${selectedServerUrl}${path}`)

    // the list of URLs is correctly rendered
    for (const serverUrl of serverUrlList) {
      expect(wrapper.findTestId(`server-endpoint-option-${serverUrl}`).exists()).toBe(true)
    }
  })

  it('emits an event when a new server URL is selected', async () => {
    // initial value was the second item in serverUrlList array
    // updating it to the first item should trigger emit
    await select.setValue(serverUrlList[0])
    expect(wrapper.emitted('selected-server-changed')?.toString()).toBe(serverUrlList[0])
  })
})
