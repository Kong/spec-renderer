import type { IServer } from '@stoplight/types'
import { computed, shallowRef } from 'vue'

type ServerList = Array<IServer>
type SelectedServerUrl = string

const serverList = shallowRef<ServerList>([])
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
  const initialize = ({
    newServerList,
    newSelectedServerUrl,
  }: {
    newServerList: ServerList;
    newSelectedServerUrl: SelectedServerUrl;
  }) => {
    serverList.value = newServerList
    selectedServerUrl.value = newSelectedServerUrl
  }

  /**
   * Add a new server to the list of servers in the state.
   * Also generates a unique ID for the server, based on its index in the list.
   */
  const addServerUrl = (newServerUrl: string) => {
    serverList.value.push({ id: serverList.value.length.toString(), url: newServerUrl })
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
