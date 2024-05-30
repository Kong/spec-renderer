<template>
  <div class="server-endpoint">
    <div class="current-endpoint">
      <MethodBadge
        :method="method"
        size="large"
      />
      <div class="server-endpoint-url">
        <span>{{ selectedServerUrl }}</span><span>{{ path }}</span>
      </div>
    </div>
    <div class="right">
      <select
        id="endpoint-server-select"
        name="endpoint-server"
        @change="changeEndpointServer"
      >
        <option
          v-for="serverURL in serverUrlList"
          :key="serverURL"
          :selected="serverURL === selectedServerUrl"
          :value="serverURL"
        >
          {{ serverURL }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import MethodBadge from '@/components/common/MethodBadge.vue'

defineProps({
  method: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  serverUrlList: {
    type: Array as PropType <Array<string>>,
    default: () => [],
  },
  selectedServerUrl: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'selected-server-changed', url: string): void
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
