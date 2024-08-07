<template>
  <div class="overview-page">
    <PageHeader
      class="overview-page-header"
      :title="data.name"
    >
      <div class="overview-page-versions">
        <LabelBadge
          :label="`v${data.version}`"
          type="primary"
        />
        <LabelBadge
          :label="specVersion"
          type="neutral"
        />
      </div>
    </PageHeader>

    <section class="overview-page-content">
      <MarkdownRenderer
        v-if="data.description"
        :markdown="data.description"
      />
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
    </section>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpService } from '@stoplight/types'
import ServerList from './overview/ServerList.vue'
import SecurityList from './overview/SecurityList.vue'
import AdditionalInfo from './overview/AdditionalInfo.vue'
import LabelBadge from '../common/LabelBadge.vue'
import PageHeader from '../common/PageHeader.vue'
import MarkdownRenderer from '../common/MarkdownRenderer.vue'

defineProps({
  data: {
    type: Object as PropType<IHttpService>,
    required: true,
  },
  specVersion: {
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
  .overview-page-header {
    margin-bottom: var(--kui-space-90, $kui-space-90);
    .overview-page-versions {
      align-items: center;
      display: flex;
      gap: var(--kui-space-50, $kui-space-50);
    }
  }
  .overview-page-content {
    // add spacing between content components, via margin
    > :not(:first-child) {
      margin-top: var(--kui-space-70, $kui-space-70);
    }
  }
}
</style>
