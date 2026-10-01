<template>
  <div>
    <template v-if="scheme.flows.clientCredentials">
      <div
        v-if="hasBothFlows"
        class="flow-heading"
        :data-testid="`tryit-auth-flow-heading-clientCredentials-${dataId}`"
      >
        Client credentials
      </div>
      <TryItAuth2ClientCredentials
        :data-id="dataId"
        :scheme="scheme"
        :scheme-key="schemeKey"
      />
    </template>
    <template v-if="showPkce">
      <div
        v-if="hasBothFlows"
        class="flow-heading"
        :data-testid="`tryit-auth-flow-heading-authorizationCode-${dataId}`"
      >
        Authorization code (PKCE)
      </div>
      <TryItAuthCode
        :data-id="dataId"
        :scheme="scheme"
        :scheme-key="schemeKey"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
// Picks the panel for each OAuth2 flow the scheme declares. A scheme can declare several.
import { computed, inject } from 'vue'
import type { IOauth2SecurityScheme } from '@stoplight/types'
import TryItAuth2ClientCredentials from '@/components/spec-document/try-it/TryItAuth2ClientCredentials.vue'
import TryItAuthCode from '@/components/spec-document/try-it/TryItAuthCode.vue'

const { schemeKey, dataId, scheme } = defineProps<{
  schemeKey: string
  dataId: string
  scheme: IOauth2SecurityScheme
}>()

const oauthRedirectUri = inject('oauth-redirect-uri', computed(() => ''))

// PKCE is opt-in, it needs the host's redirect URI
const showPkce = computed<boolean>(() => !!scheme.flows.authorizationCode && !!oauthRedirectUri.value)

// headings only help when two panels share the space
const hasBothFlows = computed<boolean>(() => !!scheme.flows.clientCredentials && showPkce.value)
</script>

<style lang="scss" scoped>
.panel-body {
  .flow-heading {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    margin-bottom: var(--kui-space-30, $kui-space-30);
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}
</style>
