<template>
  <section
    class="endpoint-http-response"
    data-testid="endpoint-http-response"
  >
    <CollapsibleSection>
      <template #title>
        <div class="http-response-header">
          <h3>{{ title }}</h3>
          <slot />
        </div>
      </template>

      <BodyContentList
        :contents="contentList"
        :description="description"
        :hide-readonly="hideReadonly"
      />
    </CollapsibleSection>
  </section>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IMediaTypeContent } from '@stoplight/types'
import CollapsibleSection from './CollapsibleSection.vue'
import BodyContentList from './BodyContentList.vue'

defineProps({
  description: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: 'Response',
  },
  contentList: {
    type: Array as PropType<Array<IMediaTypeContent>>,
    default: () => [],
  },
  hideReadonly: {
    type: Boolean,
    default: false,
  },
})
</script>

<style lang="scss" scoped>
.endpoint-http-response {
  .http-response-header {
    align-items: center;
    display: inline-flex;
    flex-wrap: wrap;
    gap: var(--kui-space-50, $kui-space-50);
  }

  @media (max-width: $kui-breakpoint-mobile) {
    :deep(.chevron-icon) {
      align-self: baseline;
    }
  }
}
</style>
