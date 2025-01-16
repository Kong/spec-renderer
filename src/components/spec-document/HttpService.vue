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
        v-if="serverList.length"
        :server-list="serverList"
        @add-custom-url="addServerUrl"
      />
      <SecurityList
        v-if="Array.isArray(data.securitySchemes) && data.securitySchemes.length"
        :security-scheme-list="data.securitySchemes"
      />
      <AdditionalInfo
        v-if="additionalInfoVisible"
        :contact="data.contact"
        :external-docs="data.externalDocs"
        :license="data.license"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { IHttpService } from '@stoplight/types'
import ServerList from './overview/ServerList.vue'
import SecurityList from './overview/SecurityList.vue'
import AdditionalInfo from './overview/AdditionalInfo.vue'
import LabelBadge from '../common/LabelBadge.vue'
import PageHeader from '../common/PageHeader.vue'
import MarkdownRenderer from '../common/MarkdownRenderer.vue'
import composables from '@/composables'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpService>,
    required: true,
  },
  specVersion: {
    type: String,
    required: true,
  },
})

const { serverList, addServerUrl } = composables.useServerList()

const additionalInfoVisible = computed(() => props.data.externalDocs?.url || props.data.contact?.url || props.data.contact?.email || props.data.license?.name)
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
