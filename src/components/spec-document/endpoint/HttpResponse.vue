<template>
  <section
    class="endpoint-http-response"
    data-testid="endpoint-http-response"
  >
    <CollapsibleSection>
      <template #title>
        <div class="http-response-header">
          <h2>{{ title }}</h2>
          <slot />
        </div>
      </template>

      <BodyContentList
        v-if="Array.isArray(contentList) && contentList.length"
        :contents="contentList"
        :description="description"
      />
      <HttpResponseDescription
        v-else
        :description="description"
        :response-code="responseCode"
      />
    </CollapsibleSection>
  </section>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperationResponse } from '@stoplight/types'
import CollapsibleSection from './CollapsibleSection.vue'
import BodyContentList from './BodyContentList.vue'
import HttpResponseDescription from './HttpResponseDescription.vue'

defineProps({
  responseCode: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: 'Response',
  },
  contentList: {
    type: Array as PropType<IHttpOperationResponse['contents']>,
    default: () => [],
  },
})
</script>

<style lang="scss" scoped>
.endpoint-http-response {
  .http-response-header {
    align-items: center;
    display: inline-flex;
    gap: var(--kui-space-50, $kui-space-50);
  }

  .http-response-description {
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}
</style>
