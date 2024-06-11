import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ServerList from './ServerList.vue'

describe('<ServerList />', () => {
  it('renders', () => {
    const serverList = [
      {
        id: 'sample-server-id',
        url: 'https://stoplight.io/api',
        description: 'sample description',
      },
      {
        id: 'sample-server-id-2',
        url: 'https://stoplight.io/api-2',
        description: 'sample description 2',
      },
    ]

    const wrapper = mount(ServerList, {
      props: {
        serverList,
      },
    })

    // the component itself is rendered
    expect(wrapper.findTestId('overview-server-list').exists()).toBe(true)

    // ——— both servers are rendered ———
    for (const server of serverList) {
      expect(wrapper.findTestId(`overview-server-list-item-${server.id}`).exists()).toBe(true)
    }
  })
})
