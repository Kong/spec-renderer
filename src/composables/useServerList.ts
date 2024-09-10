import { reactive, toRefs } from 'vue'

interface ServerListState {
  serverUrlList: Array<string>
  selectedServerUrl: string
}

const state: ServerListState = reactive({
  serverUrlList: [],
  selectedServerUrl: '',
})

/**
 * Centralized state for server list.
 * Gets initialized In SpecDocument. Re-initialized whenever new document is loaded.
 *
 * Maintainst state for:
 * - list of server urls
 * - selected server url
 */
export default function useSyncState() {

  const { serverUrlList, selectedServerUrl } = toRefs(state)

  const initialize = ({ serverUrlList, selectedServerUrl }: ServerListState) => {
    console.log('initializing server list: ', { serverUrlList, selectedServerUrl })
    state.serverUrlList = serverUrlList
    state.selectedServerUrl = selectedServerUrl
  }

  const addServerUrl = (newServerUrl: string) => {
    state.serverUrlList.push(newServerUrl)
  }

  const removeServerUrl = (serverUrl: string) => {
    state.serverUrlList = state.serverUrlList.filter(url => url !== serverUrl)
  }

  return {
    serverUrlList,
    selectedServerUrl,
    initialize,
    addServerUrl,
    removeServerUrl,
  }
}
