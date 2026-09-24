<template>
  <TryItAuth2ClientCredentials
    :data-id="dataId"
    :scheme="scheme"
    :scheme-key="schemeKey"
  />
</template>

<script setup lang="ts">
// Currently this component only renders the client credentials flow, but soon it'll have support for other OAuth2 flows as well, like PKCE
// Hence still kept as a separate component for future extensibility.
import type { IOauth2SecurityScheme } from '@stoplight/types'
import TryItAuth2ClientCredentials from '@/components/spec-document/try-it/TryItAuth2ClientCredentials.vue'

defineProps<{
  schemeKey: string
  dataId: string
  scheme: IOauth2SecurityScheme
}>()
</script>
