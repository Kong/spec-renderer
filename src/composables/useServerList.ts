import type { IServer } from '@stoplight/types'
import { computed, shallowRef } from 'vue'

interface ServerListState {
  serverList: Array<IServer>
  selectedServerUrl: string
}

const serverListState = shallowRef<Array<IServer>>([])
const selectedServerUrlState = shallowRef<string>('')

/**
 * Centralized state for server list.
 * Gets initialized In SpecDocument. Re-initialized whenever new document is loaded.
 *
 * Maintainst state for:
 * - list of server urls
 * - selected server url
 */
export default function useServerList() {

  // const { serverList, selectedServerUrl } = state.value

  const initialize = ({ serverList, selectedServerUrl }: ServerListState) => {
    serverListState.value = serverList
    selectedServerUrlState.value = selectedServerUrl
  }

  const addServerUrl = (newServerUrl: string) => {
    serverListState.value.push({ id: serverListState.value.length.toString(), url: newServerUrl })
  }

  const removeServerUrl = (serverUrl: string) => {
    serverListState.value = serverListState.value.filter(server => server.url !== serverUrl)
  }

  const serverUrlList = computed(() => serverListState.value?.map(server => server.url) ?? [])

  return {
    serverList: serverListState,
    selectedServerUrl: selectedServerUrlState,
    serverUrlList,
    initialize,
    addServerUrl,
    removeServerUrl,
  }
}
