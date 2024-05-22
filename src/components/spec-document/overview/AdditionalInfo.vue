<template>
  <div
    class="overview-additional-info"
    data-testid="overview-additional-info"
  >
    <h4>Additional Information</h4>
    <div v-if="contact?.url || contact?.email">
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
      :href="license.url"
    >
      {{ license.name }} License
    </component>
    <a
      v-if="externalDocs?.url"
      :href="externalDocs.url"
    >
      {{ externalDocs.description || externalDocs.url }}
    </a>
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

<style lang="scss" scoped>
.overview-additional-info {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-50, $kui-space-50);
}
</style>
