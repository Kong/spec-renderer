<template>
  <OverviewPanel title="API Base URL">
    <template #header-icon>
      <NetworkIcon
        :size="20"
      />
    </template>
    <template #content>
      <ul
        class="overview-server-list"
        data-testid="overview-server-list"
      >
        <li
          v-for="(server, index) in serverList"
          :key="server.id"
          class="overview-server-list-item"
          :data-testid="`overview-server-list-item-${server.id}`"
        >
          <div class="server-item-header">
            <span>Server {{ index + 1 }}:</span>
            <span>{{ server.url }}</span>
          </div>
          <MarkdownRenderer
            v-if="server.description"
            :markdown="server.description"
          />
        </li>
        <template v-if="allowCustomServerUrl">
          <div
            v-if="showCustomUrlInput"
            class="overview-server-list-add-custom-url-input"
          >
            <input
              v-model.trim="customURl"
              placeholder="Enter custom URL"
              type="text"
            >
            <button
              class="secondary"
              @click="handleAddCustomUrl"
            >
              Save URL
            </button>
            <button
              class="tertiary"
              @click="clearCustomUrlInput"
            >
              Cancel
            </button>
          </div>

          <button
            v-else
            class="secondary"
            @click="showCustomUrlInput = true"
          >
            <AddIcon decorative />
            Add custom URL
          </button>
        </template>
      </ul>
    </template>
  </OverviewPanel>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NetworkIcon } from '@kong/icons'
import type { IServer } from '@stoplight/types'
import type { PropType } from 'vue'
import OverviewPanel from './OverviewPanel.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import { AddIcon } from '@kong/icons'

defineProps({
  serverList: {
    type: Array as PropType<IServer[]>,
    required: true,
  },
  allowCustomServerUrl: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'add-custom-url', url: string): void
}>()

const showCustomUrlInput = ref<boolean>(false)
const customURl = ref('')

const handleAddCustomUrl = () => {
  if (!customURl.value.length) return

  emit('add-custom-url', customURl.value)
  clearCustomUrlInput()
}

const clearCustomUrlInput = () => {
  showCustomUrlInput.value = false
  customURl.value = ''
}
</script>

<style lang="scss" scoped>
.overview-server-list {
  color: var(--kui-color-text, $kui-color-text);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  list-style: none;
  padding: var(--kui-space-0, $kui-space-0);

  button {
    @include button-default;
    height: var(--kui-icon-size-70, $kui-icon-size-70);
  }

  > :not(:first-child) {
    margin-top: var(--kui-space-50, $kui-space-50);
  }

  > .overview-server-list-item {
    background-color: var(--kui-color-background, $kui-color-background);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
    overflow-wrap: anywhere;
    padding: var(--kui-space-50, $kui-space-50);

    .server-item-header {
      color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
      font-family: var(--kui-font-family-code, $kui-font-family-code);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      line-height: var(--kui-line-height-30, $kui-line-height-30);

      > :first-child {
        color: var(--kui-color-text, $kui-color-text);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        margin-right: var(--kui-space-40, $kui-space-40);
      }
    }
  }

  > .overview-server-list-add-custom-url-input {
    align-items: center;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);

    input {
      @include input-default;
    }
  }
}
</style>
