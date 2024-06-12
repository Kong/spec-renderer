<template>
  <div
    class="server-endpoint"
    data-testid="server-endpoint"
  >
    <div class="current-endpoint">
      <MethodBadge
        :method="method"
        size="large"
      />
      <div
        class="server-endpoint-url-with-path"
        data-testid="server-endpoint-url-with-path"
      >
        <span class="selected-server-url">{{ selectedServerUrl }}</span>
        <span class="endpoint-path">{{ path }}</span>
        <ChevronDownIcon size="20px" />
      </div>
    </div>

    <CopyButton :content="selectedServerUrl+path" />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { ChevronDownIcon } from '@kong/icons'
import MethodBadge from '@/components/common/MethodBadge.vue'
import CopyButton from '@/components/common/CopyButton.vue'

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
    required: true,
  },
  selectedServerUrl: {
    type: String,
    required: true,
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

  >.current-endpoint {
    align-items: center;
    display: flex;
    gap: var(--kui-space-20, $kui-space-20);

    .server-endpoint-url-with-path {
      align-items: center;
      display: flex;
      font-family: var(--kui-font-family-code, $kui-font-family-code);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      gap: var(--kui-space-20, $kui-space-20);
      line-height: var(--kui-line-height-40, $kui-line-height-40);

      .selected-server-url {
        color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
      }
      .endpoint-path {
        color: var(--kui-color-text, $kui-color-text);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      }
    }
  }
}
</style>
