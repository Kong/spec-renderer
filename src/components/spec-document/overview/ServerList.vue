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
          <span v-if="server.description"> ({{ server.description }})</span>
        </li>
      </ul>
    </template>
  </OverviewPanel>
</template>

<script setup lang="ts">
import { NetworkIcon } from '@kong/icons'
import type { IServer } from '@stoplight/types'
import type { PropType } from 'vue'
import OverviewPanel from './OverviewPanel.vue'

defineProps({
  serverList: {
    type: Array as PropType<Array<IServer>>,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.overview-server-list {
  color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
  font-family: var(--kui-font-family-code, $kui-font-family-code);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  list-style: none;
  padding: var(--kui-space-0, $kui-space-0);

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
}
</style>
