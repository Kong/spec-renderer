<template>
  <section class="endpoint-http-response">
    <CollapsibleSection>
      <template #title>
        <div class="http-response-header">
          <h2>Response</h2>
          <slot />
        </div>
      </template>

      <div class="http-response-body">
        <p
          v-if="response.description"
          class="http-response-body-description"
        >
          {{ response.description }}
        </p>
        <div
          v-for="content in response.contents"
          :key="content.id"
          class="http-response-body-content"
        >
          <ModelNode
            v-if="content.schema"
            :schema="content.schema"
            :title="content.schema.title"
          />
        </div>
      </div>
    </CollapsibleSection>
  </section>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperationResponse } from '@stoplight/types'
import CollapsibleSection from './CollapsibleSection.vue'
import ModelNode from '../schema-model/ModelNode.vue'

defineProps({
  response: {
    type: Object as PropType<IHttpOperationResponse>,
    default: () => ({}),
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
