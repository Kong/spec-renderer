<template>
  <OverviewPanel title="Additional Information">
    <template #header-icon>
      <InfoIcon
        :size="20"
      />
    </template>
    <template #content>
      <div class="overview-additional-info">
        <div
          v-if="contact?.url || contact?.email"
          class="overview-additional-info-contact"
          data-testid="overview-additional-info-contact"
        >
          Contact
          <a
            v-if="contact?.url"
            :href="contact.url"
            rel="noopener noreferrer"
            target="_blank"
          >
            {{ contact.name }}
          </a>
          <a
            v-if="contact?.email"
            :href="`mailto:${contact.email}`"
            rel="noopener noreferrer"
            target="_blank"
          >
            ({{ contact.email }})
          </a>
        </div>
        <component
          :is="license?.url ? 'a': 'p'"
          v-if="license?.name"
          class="overview-additional-info-license"
          data-testid="overview-additional-info-license"
          :href="license.url"
          rel="noopener noreferrer"
          target="_blank"
        >
          {{ license.name }} License
        </component>
        <a
          v-if="externalDocs?.url"
          class="overview-additional-info-external-docs"
          :href="externalDocs.url"
          rel="noopener noreferrer"
          target="_blank"
        >
          {{ externalDocs.description || externalDocs.url }}
        </a>
      </div>
    </template>
  </OverviewPanel>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpService } from '@stoplight/types'
import { InfoIcon } from '@kong/icons'
import OverviewPanel from './OverviewPanel.vue'

defineProps({
  contact: {
    type: Object as PropType<IHttpService['contact']>,
    default: () => ({}),
  },
  license: {
    type: Object as PropType<IHttpService['license']>,
    default: () => ({}),
  },
  externalDocs: {
    type: Object as PropType<IHttpService['externalDocs']>,
    default: () => ({}),
  },
})
</script>

<style lang="scss" scoped>
.overview-additional-info {
  .overview-additional-info-license,
  .overview-additional-info-external-docs,
  .overview-additional-info-contact {
    display: block;
  }
  > :not(:first-child) {
    margin-top: var(--kui-space-50, $kui-space-50);
  }
}
</style>
