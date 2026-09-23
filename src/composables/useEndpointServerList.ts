import { computed, ref, unref, watch } from 'vue'
import type { ComputedRef, Ref, WritableComputedRef } from 'vue'
import type { IServer } from '@/types'
import useServerList from './useServerList'
import { formatServerUrl, getServerIdentity } from '@/utils/server-url'

/**
 * Drop-in replacement for `useServerList` for an individual endpoint/operation.
 *
 * - an operation can declare its own `servers` block: those scoped servers replace the service-level
 *   servers for that operation, and their selection stays local to it
 * - operations without scoped servers fall through to the global `useServerList` state
 * - custom server urls added by the user at runtime are shared: they sync globally, also when selected from a scoped operation.
 */
export default function useEndpointServerList(operationServers: Ref<IServer[] | undefined>) {
  const {
    serverList,
    serverUrlList: globalServerUrlList,
    selectedServerUrl: globalSelectedServerUrl,
  } = useServerList()

  const servers = computed(() => unref(operationServers) ?? [])

  /**
   * Identities of the servers as defined in the spec's `servers` block.
   * We filter out the custom server urls added by the user at runtime, as they do not have an `origUrl`.
   *
   * Then we append the server's "identity" (i.e. the combination of its URL template + variable defaults) to it
   * so that we can distinguish between servers that share the same URL template but have different variable defaults.
   */
  const documentServerIdentities = computed(() =>
    new Set(serverList.value.filter(server => server.origUrl).map(getServerIdentity)),
  )

  /** Custom server urls added by the user at runtime. */
  const customServerUrls = computed(() => serverList.value.filter(server => !server.origUrl).map(server => server.url))

  /** The operation has scoped servers when it declares servers absent from the document's root `servers` block. */
  const hasScopedServers = computed((): boolean => {
    if (!servers.value.length) {
      return false
    }
    return servers.value.some(server => !documentServerIdentities.value.has(getServerIdentity(server)))
  })

  /** Formatted urls of the operation's own servers, with server variables applied. */
  const scopedServerUrlList = computed((): string[] => {
    const urls: string[] = []
    for (const server of servers.value) {
      const url = formatServerUrl(server)
      if (url && !urls.includes(url)) {
        urls.push(url)
      }
    }
    return urls
  })

  /** Scoped selection is local to the operation and must not leak into the global one. */
  const selectedScopedServerUrl = ref('')

  /** Urls for the endpoint picker: the operation's own servers (plus custom urls) when scoped, the global list otherwise. */
  const serverUrlList: ComputedRef<string[]> = computed(() => {
    if (!hasScopedServers.value) {
      return globalServerUrlList.value
    }
    return [
      ...scopedServerUrlList.value,
      ...customServerUrls.value.filter(url => !scopedServerUrlList.value.includes(url)),
    ]
  })

  /** Whether the given url is a custom server url added by the user at runtime. */
  const isCustomServerUrl = (url: string): boolean => customServerUrls.value.includes(url)

  // a custom url selected globally is adopted by scoped operations, dropping their local selection
  watch(globalSelectedServerUrl, (url) => {
    if (isCustomServerUrl(url)) {
      selectedScopedServerUrl.value = ''
    }
  })

  /**
   * Currently selected server url for the operation's endpoint. Priority order:
   * - local scoped selection
   * - globally selected custom url
   * - first scoped server url
   * Falls back to the global selection when the operation has no scoped servers;
   */
  const selectedServerUrl: WritableComputedRef<string> = computed({
    get: () => {
      if (!hasScopedServers.value) {
        return globalSelectedServerUrl.value
      }
      if (scopedServerUrlList.value.includes(selectedScopedServerUrl.value)) {
        return selectedScopedServerUrl.value
      }
      if (isCustomServerUrl(globalSelectedServerUrl.value)) {
        return globalSelectedServerUrl.value
      }
      return scopedServerUrlList.value[0] ?? ''
    },
    set: (url: string) => {
      if (hasScopedServers.value && !isCustomServerUrl(url)) {
        selectedScopedServerUrl.value = url
        return
      }
      // a custom url selection syncs globally; drop the local scoped selection so it is displayed here
      if (hasScopedServers.value) {
        selectedScopedServerUrl.value = ''
      }
      globalSelectedServerUrl.value = url
    },
  })

  return {
    serverUrlList,
    selectedServerUrl,
  }
}
