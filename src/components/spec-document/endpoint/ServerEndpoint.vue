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

      <SelectDropdown
        v-if="serverUrlList.length > 1"
        class="server-select-dropdown"
        :data-testid="`server-dropdown-${dataTestId}`"
        dynamic-width
        :option-list="serverUrlList"
        :selected-option="selectedServerUrl"
        @selected-option-changed="changeEndpointServer"
      >
        <span
          class="endpoint-path"
          data-testid="endpoint-path"
        >{{ path }}</span>
        <ChevronDownIcon size="20px" />
      </SelectDropdown>

      <div
        v-else
        class="server-url-with-path"
        :data-testid="`server-url-${dataTestId}`"
      >
        <span>{{ selectedServerUrl }}</span>
        <span
          class="endpoint-path"
          data-testid="endpoint-path"
        >{{ path }}</span>
      </div>
    </div>

    <CopyButton :content="selectedServerUrl+path" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import { ChevronDownIcon } from '@kong/icons'
import MethodBadge from '@/components/common/MethodBadge.vue'
import CopyButton from '@/components/common/CopyButton.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'

const props = defineProps({
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

// unique id for a server-endpoint component
const dataTestId = computed(() => `${props.method}-${props.serverUrlList[0]}-${props.path}`)

function changeEndpointServer(url: string) {
  emit('selected-server-changed', url)
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

    .server-select-dropdown, .server-url-with-path {
      gap: var(--kui-space-20, $kui-space-20);

      // to target the select and options elements
      >* {
        color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
        font-family: var(--kui-font-family-code, $kui-font-family-code);
        font-size: var(--kui-font-size-30, $kui-font-size-30);
      }

      .endpoint-path {
        color: var(--kui-color-text, $kui-color-text);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      }
    }

    .server-url-with-path {
      align-items: center;
      display: flex;
    }
  }
}
</style>
