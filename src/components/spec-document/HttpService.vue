<template>
  <div class="overview-page">
    <PageHeader :title="data.name">
      <template #footer>
        <p class="overview-page-versions">
          <VersionBadge type="primary">
            v{{ data.version }}
          </VersionBadge>
          <VersionBadge type="neutral">
            OAS {{ openApiVersion }}
          </VersionBadge>
        </p>
      </template>
    </PageHeader>

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
import PageHeader from '../common/PageHeader.vue'

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
  .overview-page-versions {
    align-items: center;
    display: flex;
    gap: var(--kui-space-50, $kui-space-50);
  }
}
</style>
