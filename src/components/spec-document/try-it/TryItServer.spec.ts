import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TryItServer from './TryItServer.vue'


describe('<TryItServer />', () => {
  it.only('Should show server variables', async () => {
    const wrapper = mount(TryItServer, {
      props: {
        data: {
          id: '123',
          method: 'get',
          path: '/sample-path',
          responses: [],
          servers: [{
            id: 'sample-server-id',
            url: '{protocol}:{hostname}/v2',
            variables: {
              hostname: {
                default: 'HOSTNAME',
                description: 'Self-hosted Enterprise Server or Enterprise Cloud hostname',
              },
              protocol: {
                default: 'http',
                'description': 'Self-hosted Enterprise Server or Enterprise Cloud protocol',
              },
            },
          }],
        },
        serverUrl: '{protocol}:{hostname}/v2',
      },
    })

    const field = wrapper.findTestId('tryit-server-protocol-123')
    expect(field.exists()).toBe(true)
  })
})
