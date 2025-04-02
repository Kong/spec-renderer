<template>
  <div class="overview-page">
    <PageHeader
      class="overview-page-header"
      :title="data.name"
    >
      <template
        v-if="!hideDownloadButton"
        #actions
      >
        <button
          class="download-spec-btn"
          @click="downloadSpec"
        >
          Download
        </button>
      </template>
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
        v-if="serverList.length || allowCustomServerUrl"
        :allow-custom-server-url="allowCustomServerUrl"
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
import { kebabCase } from '@/utils'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpService>,
    required: true,
  },
  specVersion: {
    type: String,
    required: true,
  },
  specUrl: {
    type: String,
    default: '',
  },
  allowCustomServerUrl: {
    type: Boolean,
    default: false,
  },
  hideDownloadButton: {
    type: Boolean,
    default: false,
  },
})

const { serverList, addServerUrl } = composables.useServerList()
const { specText } = composables.useSchemaParser()

const additionalInfoVisible = computed(() => props.data.externalDocs?.url || props.data.contact?.url || props.data.contact?.email || props.data.license?.name)

const downloadSpec = async () => {
  try {
    if (props.specUrl) {
      const response = await fetch(props.specUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('Content-Type')
      let fileExtension = 'json' // Default extension


      if (contentType?.includes('json')) {
        fileExtension = 'json'
      } else if (contentType?.includes('yaml')) {
        fileExtension = 'yaml'
      } else {
        const responseText = await response.text()
        fileExtension = jsonOrYaml(responseText)
      }

      const blob = await response.blob()
      downloadBlob(blob, fileExtension)

    } else if (specText.value?.length) {
      const fileExtension = jsonOrYaml(specText.value)
      const blob = new Blob([specText.value], { type: fileExtension })
      downloadBlob(blob, fileExtension)
    }
  } catch (e) {
    console.error('@kong/spec-renderer: error in downloading spec file:', e)
  }
}

const jsonOrYaml = (text: string) => text.startsWith('{') || text.startsWith('[') ? 'json' : 'yaml'

const downloadBlob = (blob: Blob, fileExtension: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', `${kebabCase(props.data.name)}.${fileExtension}`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.URL.revokeObjectURL(url)
}
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

    .download-spec-btn {
      @include default-button-reset;
      color: var(--kui-color-text-primary, $kui-color-text-primary);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
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
