<template>
  <div>
    <h3>{{ data.name }}</h3>
    <p>v{{ data.version }}</p>
    <div>
      <h4>Servers</h4>
      <ul>
        <li
          v-for="server in data.servers"
          :key="server.url"
        >
          {{ server.name }} {{ server.description }}:
          <a
            :href="server.url"
            rel="noopener noreferrer"
            target="_blank"
          >{{ server.url }}</a>
        </li>
      </ul>
    </div>
    <div>
      <h4>Security</h4>
      <div
        v-for="scheme in data.securitySchemes"
        :key="scheme.toString()"
      >
        {{ scheme.key }}
        <p>
          {{ scheme.description }}
        </p>
      </div>
    </div>
    <p>v{{ data.description }}</p>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpService } from '@stoplight/types'

defineProps({
  data: {
    type: Object as PropType<IHttpService>,
    required: true,
  },
})
</script>
