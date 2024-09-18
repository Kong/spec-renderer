import type { IServer } from '@stoplight/types'
import { computed, reactive, toRefs } from 'vue'

interface ServerListState {
  serverList: Array<IServer>
  selectedServerUrl: string
}

const state: ServerListState = reactive({
  serverList: [],
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

  const { serverList, selectedServerUrl } = toRefs(state)

  const initialize = ({ serverList, selectedServerUrl }: ServerListState) => {
    state.serverList = serverList
    state.selectedServerUrl = selectedServerUrl
  }

  const addServerUrl = (newServerUrl: string) => {
    state.serverList.push({ id: state.serverList.length.toString(), url: newServerUrl })
  }

  const removeServerUrl = (serverUrl: string) => {
    state.serverList = state.serverList.filter(server => server.url !== serverUrl)
  }

  const serverUrlList = computed(() => serverList.value?.map(server => server.url) ?? [])

  return {
    serverList,
    serverUrlList,
    selectedServerUrl,
    initialize,
    addServerUrl,
    removeServerUrl,
  }
}
