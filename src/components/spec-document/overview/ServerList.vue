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
          <span>Server {{ index + 1 }}:</span>
          <span>{{ server.url }}</span>
          <span v-if="server.name"> [{{ server.name }}]</span>
          <MarkdownRenderer
            v-if="server.description"
            :markdown="server.description"
          />
        </li>

        <div
          v-if="showCustomUrlInput"
          class="overview-server-list-add-custom-url-input"
        >
          <input
            v-model="customURl"
            placeholder="Enter custom URL"
            type="text"
          >
          <button
            @click="handleAddCustomUrl"
          >
            <AddIcon />
            Add custom URL
          </button>
          <button
            class="danger"
            @click="clearCustomUrlInput"
          >
            <ClearIcon />
            Cancel
          </button>
        </div>

        <button
          v-else
          @click="showCustomUrlInput = true"
        >
          <AddIcon />
          Add custom URL
        </button>
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
import { AddIcon, ClearIcon } from '@kong/icons'
import { removeTrailingSlash } from '@/utils'

defineProps({
  serverList: {
    type: Array as PropType<Array<IServer>>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'add-custom-url', url: string): void
}>()

const showCustomUrlInput = ref<boolean>(false)
const customURl = ref('')

const handleAddCustomUrl = () => {
  if (!customURl.value.length) return

  emit('add-custom-url', removeTrailingSlash(customURl.value))
  clearCustomUrlInput()
}

const clearCustomUrlInput = () => {
  showCustomUrlInput.value = false
  customURl.value = ''
}
</script>

<style lang="scss" scoped>
.overview-server-list {
  color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
  font-family: var(--kui-font-family-code, $kui-font-family-code);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  list-style: none;
  padding: var(--kui-space-0, $kui-space-0);

  button {
    @include button-default;
  }

  > :not(:first-child) {
    margin-top: var(--kui-space-50, $kui-space-50);
  }

  > .overview-server-list-item {
    background-color: var(--kui-color-background, $kui-color-background);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
    padding: var(--kui-space-50, $kui-space-50);

    > :first-child {
      color: var(--kui-color-text, $kui-color-text);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      margin-right: var(--kui-space-40, $kui-space-40);
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
