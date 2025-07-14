import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ServerList from './ServerList.vue'

describe('<ServerList />', () => {
  it('renders', () => {
    const serverList = [
      {
        id: 'sample-server-id',
        url: 'https://localhost.io/api',
        description: 'sample description',
      },
      {
        id: 'sample-server-id-2',
        url: 'https://localhost.io/api-2',
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

  it('renders variables block', () => {
    const serverList = [
      {
        id: 'sample-server-id',
        url: '{protocol}://{hostname}/api',
        description: 'sample description',
        variables: {
          'hostname': {
            'default': 'HOSTNAME',
            'description': 'Self-hosted Enterprise Server or Enterprise Cloud hostname',
          },
          'protocol': {
            'default': 'http',
            'description': 'Self-hosted Enterprise Server or Enterprise Cloud protocol',
          },
        },
      },
    ]

    const wrapper = mount(ServerList, {
      props: {
        serverList,
      },
    })

    // input for hostname variable should be rendered and have a proper value
    expect(wrapper.findTestId('sample-server-id-hostname-input').exists()).toBe(true)
    expect((wrapper.findTestId('sample-server-id-hostname-input').element as HTMLInputElement).value).toEqual('HOSTNAME')

  })


})
