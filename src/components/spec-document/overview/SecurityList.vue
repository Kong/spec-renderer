<template>
  <OverviewPanel title="Security">
    <template #header-icon>
      <LockIcon
        :size="20"
      />
    </template>
    <template #content>
      <div
        class="security-list"
        data-testid="overview-security-list"
      >
        <OverviewCollapsiblePanel
          v-for="scheme in securitySchemeList"
          :key="scheme.id"
          :data-testid="`overview-security-scheme-${scheme.id}`"
          :title="`${scheme.key} (${scheme.type})`"
        >
          <MarkdownRenderer
            :markdown="getDescription(scheme)"
          />
        </OverviewCollapsiblePanel>
      </div>
    </template>
  </OverviewPanel>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { HttpSecurityScheme } from '@stoplight/types'
import { LockIcon } from '@kong/icons'
import OverviewPanel from './OverviewPanel.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import OverviewCollapsiblePanel from './OverviewCollapsiblePanel.vue'
import { getDefaultDescription } from '@kong/stoplight-http-spec/elements-core'

defineProps({
  securitySchemeList: {
    type: Array as PropType<Array<HttpSecurityScheme>>,
    required: true,
  },
})

const getDescription = (scheme: HttpSecurityScheme): string => {
  return scheme.description ?? getDefaultDescription(scheme)
}
</script>

<style lang="scss" scoped>
.security-list {
  > :not(:first-child) {
    margin-top: var(--kui-space-50, $kui-space-50);
  }
}
</style>
