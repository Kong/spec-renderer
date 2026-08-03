<template>
  <OverviewPanel
    v-if="hasAdditionalInfo"
    title="Additional Information"
  >
    <template #header-icon>
      <InfoIcon
        :size="20"
      />
    </template>
    <template #content>
      <div
        class="overview-additional-info"
        data-testid="overview-additional-info"
      >
        <div
          v-if="contactUrl || contact?.email || contact?.name"
          class="overview-additional-info-contact"
          data-testid="overview-additional-info-contact"
        >
          Contact
          <a
            v-if="contactUrl"
            :href="contactUrl"
            rel="noopener noreferrer"
            target="_blank"
          >
            {{ contact.name }}
          </a>
          <span v-else-if="contact?.name">
            {{ contact.name }}
          </span>
          <a
            v-if="contactEmailHref"
            :href="contactEmailHref"
            rel="noopener noreferrer"
            target="_blank"
          >
            ({{ contact.email }})
          </a>
          <span v-else-if="contact?.email">
            ({{ contact.email }})
          </span>
        </div>
        <component
          :is="licenseUrl ? 'a' : 'p'"
          v-if="license?.name"
          class="overview-additional-info-license"
          data-testid="overview-additional-info-license"
          :href="licenseUrl"
          rel="noopener noreferrer"
          target="_blank"
        >
          {{ license.name }} License
        </component>
        <a
          v-if="externalDocsUrl"
          class="overview-additional-info-external-docs"
          :href="externalDocsUrl"
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
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { IHttpService } from '@stoplight/types'
import { InfoIcon } from '@kong/icons'
import OverviewPanel from './OverviewPanel.vue'
import { sanitizeHref, sanitizeMailtoHref } from '@/utils/html-sanitizer'

const props = defineProps({
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

const contactUrl = computed(() => sanitizeHref(props.contact?.url))
const contactEmailHref = computed(() => sanitizeMailtoHref(props.contact?.email))
const licenseUrl = computed(() => sanitizeHref(props.license?.url))
const externalDocsUrl = computed(() => sanitizeHref(props.externalDocs?.url))

const hasAdditionalInfo = computed(() => Boolean(
  contactUrl.value || props.contact?.email || props.contact?.name || props.license?.name || externalDocsUrl.value,
))
</script>

<style lang="scss" scoped>
.overview-additional-info {
  .overview-additional-info-license,
  .overview-additional-info-external-docs,
  .overview-additional-info-contact {
    display: block;
    width: fit-content;
  }

  .overview-additional-info-license[href],
  .overview-additional-info-external-docs {
    @include link;
  }

  .overview-additional-info-contact a {
    @include link;
  }

  > :not(:first-child) {
    margin-top: var(--kui-space-50, $kui-space-50);
  }
}
</style>
