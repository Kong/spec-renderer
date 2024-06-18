<template>
  <section
    class="endpoint-http-response"
    data-testid="endpoint-http-response"
  >
    <CollapsibleSection>
      <template #title>
        <div class="http-response-header">
          <h2>Response</h2>
          <slot />
        </div>
      </template>

      <BodyContentList
        v-if="Array.isArray(contentList) && contentList.length"
        :contents="contentList"
        :description="description"
      />
    </CollapsibleSection>
  </section>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperationResponse } from '@stoplight/types'
import CollapsibleSection from './CollapsibleSection.vue'
import BodyContentList from './BodyContentList.vue'

defineProps({
  description: {
    type: String,
    default: '',
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

  .http-response-body {
    .http-response-body-description {
      margin-top: var(--kui-space-60, $kui-space-60);
    }
    .http-response-body-content {
      margin-top: var(--kui-space-40, $kui-space-40);
    }
  }
}
</style>
