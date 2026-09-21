import { computed, ref, unref, watch } from 'vue'
import type { ComputedRef, Ref, WritableComputedRef } from 'vue'
import type { IServer } from '@/types'
import useServerList from './useServerList'
import { formatServerUrl } from '@/utils/server-url'

/**
 * Drop-in replacement for `useServerList` for an individual endpoint/operation.
 *
 * An operation can declare its own `servers` block (path-level or operation-level override in the spec).
 * Those scoped servers fully replace the service-level servers for that operation, and the selection of a
 * scoped server is kept local to the operation - it is not synced with the global server selection used
 * by the rest of the endpoints.
 *
 * Custom server urls added by the user at runtime are also offered to scoped operations; selecting one
 * syncs globally, since it is not a server that is only scoped for that endpoint. When a custom url becomes
 * the active selection globally, scoped operations adopt it, dropping their local scoped selection
 * (which can be made locally again afterwards).
 *
 * Operations without scoped servers fall through to the global `useServerList` state, exactly as before.
 */
export default function useEndpointServerList(operationServers: Ref<IServer[] | undefined>) {
  const {
    serverList,
    serverUrlList: globalServerUrlList,
    selectedServerUrl: globalSelectedServerUrl,
  } = useServerList()

  const servers = computed(() => unref(operationServers) ?? [])

  /**
   * Server urls as defined in the spec document's service-level `servers` block - the `serverList`
   * entries that come from the document (custom server urls added by the user have no origUrl).
   */
  const documentServerUrls = computed(() =>
    new Set(serverList.value.filter(server => server.origUrl).map(server => server.origUrl ?? server.url)),
  )

  /** Custom server urls added by the user at runtime (not part of the spec document). */
  const customServerUrls = computed(() => serverList.value.filter(server => !server.origUrl).map(server => server.url))

  /**
   * The operation has scoped servers when it declares servers that are not part of the service-level
   * `servers` block of the document.
   */
  const hasScopedServers = computed((): boolean => {
    if (!servers.value.length) {
      return false
    }
    return servers.value.some(server => !documentServerUrls.value.has(server.origUrl || server.url))
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

  // selection of a scoped server is local to the operation and must not leak into the global server selection
  const selectedScopedServerUrl = ref('')

  /**
   * Server urls the operation's endpoint picker should offer: the operation's own servers (plus the
   * session's custom server urls) when it has scoped ones, the global list otherwise.
   */
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

  /**
   * When a custom server url becomes the active selection globally, scoped operations adopt it: any
   * local scoped selection is dropped. The user can pick a scoped server locally again afterwards
   * without affecting the globally selected custom url.
   */
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
