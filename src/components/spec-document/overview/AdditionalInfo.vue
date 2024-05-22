<template>
  <div
    class="overview-additional-info"
    data-testid="overview-additional-info"
  >
    <h4>Additional Information</h4>
    <div
      v-if="contact?.url || contact?.email"
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
    <div v-if="license?.name">
      <component
        :is="license?.url ? 'a': 'p'"
        data-testid="overview-additional-info-license"
        :href="license.url"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ license.name }} License
      </component>
    </div>
    <div v-if="externalDocs?.url">
      <a
        :href="externalDocs.url"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ externalDocs.description || externalDocs.url }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpService } from '@stoplight/types'

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
