import { computed, nextTick, ref } from 'vue'
import { describe, it, expect, beforeEach } from 'vitest'
import useEndpointServerList from './useEndpointServerList'
import useServerList from './useServerList'
import type { IServer } from '@/types'

const globalServerList: IServer[] = [{
  id: 'global-server-id',
  url: 'https://api.example.com/v1',
  description: 'Primary API server',
}]

describe('useEndpointServerList', () => {
  const { initialize, selectedServerUrl: globalSelectedServerUrl, addServerUrl } = useServerList()

  beforeEach(() => {
    initialize(globalServerList)
  })

  it('falls back to the global server list when the operation has no servers', () => {
    const { serverUrlList, selectedServerUrl } = useEndpointServerList(computed(() => undefined))

    expect(serverUrlList.value).toEqual(['https://api.example.com/v1'])
    expect(selectedServerUrl.value).toBe('https://api.example.com/v1')
  })

  it('falls back to the global server list when the operation servers are the document servers', () => {
    const { serverUrlList } = useEndpointServerList(computed(() => globalServerList))

    expect(serverUrlList.value).toEqual(['https://api.example.com/v1'])
  })

  it('uses the operation servers when they are scoped to the operation', () => {
    const { serverUrlList, selectedServerUrl } = useEndpointServerList(computed(() => <IServer[]>[
      {
        id: 'uploads-server-id',
        url: 'https://uploads.example.com',
        description: 'High-capacity storage upload host',
      },
    ]))

    expect(serverUrlList.value).toEqual(['https://uploads.example.com'])
    // defaults to the first scoped server
    expect(selectedServerUrl.value).toBe('https://uploads.example.com')
  })

  it('formats server variables in scoped server urls', () => {
    const { serverUrlList, selectedServerUrl } = useEndpointServerList(computed(() => <IServer[]>[
      {
        id: 'analytics-server-id',
        url: 'https://{environment}.example.com',
        variables: {
          environment: {
            default: 'analytics',
            enum: ['analytics', 'analytics-eu'],
          },
        },
      },
    ]))

    expect(serverUrlList.value).toEqual(['https://analytics.example.com'])
    expect(selectedServerUrl.value).toBe('https://analytics.example.com')
  })

  it('does not sync a scoped server selection with the global server state', () => {
    const { selectedServerUrl } = useEndpointServerList(computed(() => <IServer[]>[
      { id: 'analytics-server-id', url: 'https://analytics.example.com' },
      { id: 'analytics-eu-server-id', url: 'https://analytics-eu.example.com' },
    ]))

    selectedServerUrl.value = 'https://analytics-eu.example.com'

    expect(selectedServerUrl.value).toBe('https://analytics-eu.example.com')
    expect(globalSelectedServerUrl.value).toBe('https://api.example.com/v1')
  })

  it('adopts a custom server url that becomes active globally even after a scoped server was selected', async () => {
    const { selectedServerUrl } = useEndpointServerList(computed(() => <IServer[]>[
      { id: 'analytics-server-id', url: 'https://analytics.example.com' },
      { id: 'analytics-eu-server-id', url: 'https://analytics-eu.example.com' },
    ]))

    // a scoped server is selected locally first
    selectedServerUrl.value = 'https://analytics-eu.example.com'
    expect(selectedServerUrl.value).toBe('https://analytics-eu.example.com')

    // ...then a custom url becomes the active selection globally - the scoped
    // operation adopts it, dropping its local scoped selection
    addServerUrl('https://proxy.example.com')
    await nextTick()
    expect(selectedServerUrl.value).toBe('https://proxy.example.com')

    // the scoped selection can be made locally again without updating the
    // globally selected custom url
    selectedServerUrl.value = 'https://analytics.example.com'
    expect(selectedServerUrl.value).toBe('https://analytics.example.com')
    expect(globalSelectedServerUrl.value).toBe('https://proxy.example.com')
  })

  it('offers custom server urls to operations with scoped servers', () => {
    const scopedOperationServers = computed(() => <IServer[]>[
      { id: 'analytics-server-id', url: 'https://analytics.example.com' },
    ])
    const { serverUrlList, selectedServerUrl } = useEndpointServerList(scopedOperationServers)

    addServerUrl('https://proxy.example.com')

    // the custom url is added to the scoped operation's server list
    expect(serverUrlList.value).toEqual(['https://analytics.example.com', 'https://proxy.example.com'])
    // a custom url selection is global, so the scoped operation follows it
    expect(selectedServerUrl.value).toBe('https://proxy.example.com')
  })

  it('syncs a custom server url selected on a scoped operation globally', () => {
    const { serverUrlList, selectedServerUrl } = useEndpointServerList(computed(() => <IServer[]>[
      { id: 'analytics-server-id', url: 'https://analytics.example.com' },
    ]))

    addServerUrl('https://proxy.example.com')
    // the user goes back to the scoped server...
    selectedServerUrl.value = 'https://analytics.example.com'
    expect(selectedServerUrl.value).toBe('https://analytics.example.com')
    expect(globalSelectedServerUrl.value).toBe('https://proxy.example.com')

    // ...and then picks the custom url again - now the selection syncs globally
    selectedServerUrl.value = serverUrlList.value.find(url => url === 'https://proxy.example.com')
    expect(selectedServerUrl.value).toBe('https://proxy.example.com')
    expect(globalSelectedServerUrl.value).toBe('https://proxy.example.com')

    const { selectedServerUrl: globalEndpointSelectedServerUrl } = useEndpointServerList(computed(() => undefined))
    expect(globalEndpointSelectedServerUrl.value).toBe('https://proxy.example.com')
  })

  it('syncs a global server selection across endpoints', () => {
    const { selectedServerUrl: endpoint1SelectedServerUrl } = useEndpointServerList(computed(() => undefined))
    const { selectedServerUrl: endpoint2SelectedServerUrl } = useEndpointServerList(computed(() => undefined))

    addServerUrl('https://custom.example.com')
    endpoint1SelectedServerUrl.value = 'https://custom.example.com'

    expect(endpoint1SelectedServerUrl.value).toBe('https://custom.example.com')
    expect(endpoint2SelectedServerUrl.value).toBe('https://custom.example.com')
    expect(globalSelectedServerUrl.value).toBe('https://custom.example.com')
  })

  it('keeps a valid scoped selection and resets to the first server when the scoped list changes', () => {
    const servers = ref<IServer[] | undefined>(<IServer[]>[
      { id: 'analytics-server-id', url: 'https://analytics.example.com' },
      { id: 'analytics-eu-server-id', url: 'https://analytics-eu.example.com' },
    ])
    const { serverUrlList, selectedServerUrl } = useEndpointServerList(servers)

    selectedServerUrl.value = 'https://analytics-eu.example.com'
    expect(selectedServerUrl.value).toBe('https://analytics-eu.example.com')

    // selection is kept when it is still part of the scoped list
    servers.value = [{ id: 'analytics-eu-server-id', url: 'https://analytics-eu.example.com' }]
    expect(serverUrlList.value).toEqual(['https://analytics-eu.example.com'])
    expect(selectedServerUrl.value).toBe('https://analytics-eu.example.com')

    // selection is reset to the first server when it is no longer part of the scoped list
    servers.value = [{ id: 'analytics-apac-server-id', url: 'https://analytics-apac.example.com' }]
    expect(serverUrlList.value).toEqual(['https://analytics-apac.example.com'])
    expect(selectedServerUrl.value).toBe('https://analytics-apac.example.com')
  })
})
