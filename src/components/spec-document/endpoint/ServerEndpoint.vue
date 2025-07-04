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
        id="server-select-dropdown"
        class="server-select-dropdown"
        :data-testid="`server-dropdown-${dataTestId}`"
        :items="selectItems"
        :model-value="selectedServerUrl"
        @update:model-value="changeEndpointServer"
      >
        <template #trigger-content>
          <span class="endpoint-body">
            {{ selectedServerUrl }}
          </span>

          <span
            v-if="path"
            class="endpoint-path"
            data-testid="endpoint-path"
          >
            {{ path }}
          </span>
        </template>
      </SelectDropdown>

      <div
        v-else
        class="server-url-with-path"
        :data-testid="`server-url-${dataTestId}`"
      >
        <span
          v-if="selectedServerUrl"
          class="endpoint-body"
        >
          {{ selectedServerUrl }}
        </span>
        <span
          class="endpoint-path"
          data-testid="endpoint-path"
        >{{ path }}</span>
      </div>
    </div>

    <CopyButton :content="selectedServerUrl + path" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import MethodBadge from '@/components/common/MethodBadge.vue'
import CopyButton from '@/components/common/CopyButton.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'

const props = defineProps({
  method: {
    type: String,
    required: true,
  },
  serverUrlList: {
    type: Array as PropType <string[]>,
    required: true,
  },
  selectedServerUrl: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'selected-server-changed', url: string): void
}>()

// unique id for a server-endpoint component
const dataTestId = computed(() => `${props.method}-${props.serverUrlList[0]}${props.path}`)

const changeEndpointServer = (url: string) => {
  emit('selected-server-changed', url)
}

const selectItems = computed(() => props.serverUrlList.map((url) => ({ label: url, value: url, key: url })))
</script>

<style lang="scss" scoped>
.server-endpoint {
  align-items: center;
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  display: flex;
  gap: var(--kui-space-30, $kui-space-30);
  justify-content: space-between;
  padding: var(--kui-space-50, $kui-space-50);

  > .current-endpoint {
    align-items: center;
    display: flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    gap: var(--kui-space-20, $kui-space-20);
    line-height: var(--kui-line-height-40, $kui-line-height-40);

    .server-select-dropdown {
      :deep(.trigger-button) {
        color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
        font-family: var(--kui-font-family-code, $kui-font-family-code);
        gap: var(--kui-space-0, $kui-space-0);
        overflow-wrap: anywhere;
        padding: var(--kui-space-0, $kui-space-0) var(--kui-space-10, $kui-space-20);
        text-align: left;

        .select-chevron-icon {
          margin-left: var(--kui-space-40, $kui-space-40);
        }
      }
    }

    .server-url-with-path {
      color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
      display: flex;
      font-family: var(--kui-font-family-code, $kui-font-family-code);
      gap: var(--kui-space-20, $kui-space-20);
      overflow-wrap: anywhere;
    }

    .endpoint-body {
      display: contents;
    }

    .endpoint-path {
      color: var(--kui-color-text, $kui-color-text);
      display: contents;
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    }
  }
}
</style>
