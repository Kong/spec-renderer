<template>
  <div class="overview-page">
    <h1 class="overview-page-title">
      {{ data.name }}
    </h1>
    <p class="overview-page-versions">
      <VersionBadge type="primary">
        v{{ data.version }}
      </VersionBadge>
      <VersionBadge type="neutral">
        OAS {{ openApiVersion }}
      </VersionBadge>
    </p>
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
import VersionBadge from '../common/VersionBadge.vue'

defineProps({
  data: {
    type: Object as PropType<IHttpService>,
    required: true,
  },
  openApiVersion: {
    type: String,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.overview-page {
  * {
    margin: 0;
  }
  .overview-page-title {
    font-size: var(--kui-font-size-80, $kui-font-size-80);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    line-height: var(--kui-line-height-80, $kui-line-height-80);
  }
  .overview-page-versions {
    align-items: center;
    display: flex;
    gap: var(--kui-space-50, $kui-space-50);
  }
}
</style>
