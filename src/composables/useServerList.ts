import { computed, ref, shallowRef } from 'vue'
import { removeTrailingSlash } from '@/utils/strings'
import type { IServer } from '@stoplight/types'

type ServerList = Array<IServer>
type SelectedServerUrl = string

const serverList = ref<ServerList>([])
const selectedServerUrl = shallowRef<SelectedServerUrl>('')

/**
 * Centralized state for server list.
 * Gets initialized In SpecDocument. Re-initialized whenever new document is loaded.
 *
 * Maintains state for:
 * - list of server urls
 * - selected server url
 */
export default function useServerList() {

  /**
   * Initialize the centralized state for server list.
   */
  const initialize = (newServerList: ServerList) => {
    // strip trailing slash from server urls
    const filteredServerList = newServerList.map((server) => ({
      ...server,
      url: removeTrailingSlash(server.url),
    }))
    serverList.value = filteredServerList
    selectedServerUrl.value = filteredServerList[0]?.url || ''
  }

  /**
   * Add a new server to the list of servers in the state and generates a unique ID for the server, based on its index in the list.
   * Also sets the selected server URL to the newly added server URL.
   */
  const addServerUrl = (newServerUrl: string) => {
    const url = removeTrailingSlash(newServerUrl)
    serverList.value.push({
      id: serverList.value.length.toString(),
      url,
    })
    selectedServerUrl.value = url
  }

  /**
   * Remove a server from the list of servers in the state, based on its URL.
   */
  const removeServerUrl = (serverUrl: string) => {
    serverList.value = serverList.value.filter(server => server.url !== serverUrl)
  }

  /**
   * Get the list of server URLs from the state.
   */
  const serverUrlList = computed(() => serverList.value?.map(server => server.url) ?? [])

  return {
    serverList,
    selectedServerUrl,
    serverUrlList,
    initialize,
    addServerUrl,
    removeServerUrl,
  }
}
