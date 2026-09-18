import { computed, ref, shallowRef } from 'vue'
import { removeTrailingSlash } from '@/utils/strings'
import { formatServerUrl } from '@/utils/server-url'
import type { IServer } from '@/types'

type ServerList = IServer[]
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
    // strip trailing slash from server urls; origUrl keeps the url as defined in
    // the spec document - it distinguishes document servers from the custom
    // server urls added by the user at runtime, which have no origUrl
    const filteredServerList = newServerList.map(server => ({
      ...server,
      origUrl: server.origUrl || server.url,
      url: formatServerUrl(server),
    }))

    serverList.value = filteredServerList
    selectedServerUrl.value = formatServerUrl(filteredServerList[0])
  }

  /**
   * Add a new custom server to the list of servers in the state and generates a unique ID for the server, based on its index in the list.
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
   * Setting server variable
   * @param serverId
   * @param variableKey
   * @param variableValue
   * @returns
   */
  const setServerVariable = (serverId: string, variableKey: string, variableValue: string): void => {
    const serverIdx = serverList.value.findIndex(s => s.id === serverId)
    if (serverIdx === -1) {
      return
    }

    const server = serverList.value[serverIdx]
    if (!server || !server.variables || !server.variables[variableKey]) {
      return
    }
    if (!server.variables[variableKey].extensions) {
      server.variables[variableKey].extensions = {}
    }
    server.variables[variableKey].extensions.value = variableValue

    server.url = formatServerUrl(server)
    selectedServerUrl.value = server.url
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
    setServerVariable,
  }
}
