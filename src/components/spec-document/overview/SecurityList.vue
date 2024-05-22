<template>
  <div data-testid="overview-security-list">
    <h4>Security</h4>
    <details
      v-for="scheme in securitySchemeList"
      :key="scheme.id"
      :data-testid="`overview-security-scheme-${scheme.id}`"
    >
      <summary>{{ scheme.type }} ({{ scheme.key }})</summary>
      <p>
        {{ scheme.description }}
      </p>
    </details>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { HttpSecurityScheme } from '@stoplight/types'

defineProps({
  securitySchemeList: {
    type: Array as PropType<Array<HttpSecurityScheme>>,
    required: true,
  },
})
</script>
