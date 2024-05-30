<template>
  <div class="server-endpoint">
    <div class="current-endpoint">
      <MethodBadge
        :method="method"
        size="large"
      />
      <div class="server-endpoint-url">
        <span>{{ serverURL }}</span><span>{{ path }}</span>
      </div>
    </div>
    <div class="right">
      <select
        id="endpoint-server-select"
        name="endpoint-server"
        @change="changeEndpointServer"
      >
        <option
          v-for="server in serverList"
          :key="server.id"
          :selected="server.id === selectedServerId"
          :value="server.id"
        >
          {{ server.url }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { IServer } from '@stoplight/types'
import MethodBadge from '@/components/common/MethodBadge.vue'

const props = defineProps({
  method: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  serverList: {
    type: Array as PropType<Array<IServer>>,
    default: () => [],
  },
  selectedServerId: {
    type: String,
    default: '',
  },
})

const serverURL = computed(() => {
  const selectedServer = props.serverList.find(server => server.id === props.selectedServerId)
  return selectedServer?.url || ''
})

const emit = defineEmits<{
  (e: 'selected-server-changed', id: string): void
}>()

function changeEndpointServer(event: Event) {
  emit('selected-server-changed', (event.target as HTMLSelectElement).value)
}
</script>

<style lang="scss" scoped>
.server-endpoint {
  align-items: center;
  border: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  display: flex;
  justify-content: space-between;
  padding: var(--kui-space-50, $kui-space-50);

  &>.current-endpoint {
    align-items: center;
    display: flex;
    gap: var(--kui-space-20, $kui-space-20);
  }
}
</style>
