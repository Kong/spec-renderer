import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TryItServer from './TryItServer.vue'


describe('<TryItServer />', () => {
  const testData = {
    props: {
      data: {
        id: '123',
        method: 'get',
        path: '/sample-path',
        responses: [],
        servers: [{
          id: 'sample-server-id',
          url: '{protocol}://{hostname}/v2',
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
      serverUrl: '{protocol}://{hostname}/v2',
    },
  }

  it('Should show server variables', async () => {
    const wrapper = mount(TryItServer,testData)
    const field = wrapper.findTestId('tryit-server-protocol-123')
    expect(field.exists()).toBe(true)
  })

  it('Should emit an event when field name is changed', async () => {
    const wrapper = mount(TryItServer, testData)

    const field = wrapper.findTestId('tryit-server-hostname-123')
    await field.setValue('google.com')
    expect(wrapper.emitted('server-url-changed')?.toString()).toBe('http://google.com/v2')
  })

})
