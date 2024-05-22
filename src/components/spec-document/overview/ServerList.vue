<template>
  <div data-testid="overview-server-list">
    <h4>API Base URL</h4>
    <ul>
      <li
        v-for="(server, index) in serverList"
        :key="server.id"
        :data-testid="`overview-server-list-item-${server.id}`"
      >
        Server {{ index + 1 }}:
        <a
          :href="server.url"
          rel="noopener noreferrer"
          target="_blank"
        >{{ server.url }}</a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { IServer } from '@stoplight/types'
import type { PropType } from 'vue'

defineProps({
  serverList: {
    type: Array as PropType<Array<IServer>>,
    required: true,
  },
})
</script>
