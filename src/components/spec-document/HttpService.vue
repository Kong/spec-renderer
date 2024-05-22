<template>
  <div>
    <h3>{{ data.name }}</h3>
    <p>v{{ data.version }}</p>
    <p v-if="data.description">
      {{ data.description }}
    </p>

    <ServerList
      v-if="Array.isArray(data.servers) && data.servers.length"
      :server-list="data.servers"
    />
    <SecurityList
      v-if="Array.isArray(data.securitySchemes) && data.securitySchemes.length"
      :security-scheme-list="data.securitySchemes"
    />
    <AdditionalInfo
      v-if="data.externalDocs || data.contact || data.license"
      :contact="data.contact"
      :external-docs="data.externalDocs"
      :license="data.license"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpService } from '@stoplight/types'
import ServerList from './overview/ServerList.vue'
import SecurityList from './overview/SecurityList.vue'
import AdditionalInfo from './overview/AdditionalInfo.vue'

defineProps({
  data: {
    type: Object as PropType<IHttpService>,
    required: true,
  },
})
</script>
