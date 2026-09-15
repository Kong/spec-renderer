<template>
  <!-- v-if (not v-else-if) so that a scheme declaring both flows renders both panels
       and the user can pick either. -->
  <template v-if="hasClientCredentialsFlow">
    <TryItAuth2ClientCredentials
      :data-id="dataId"
      :scheme="scheme"
      :scheme-key="schemeKey"
    />
  </template>
  <template v-if="hasAuthorizationCodeFlow">
    <TryItAuthCode
      :data-id="dataId"
      :scheme="scheme"
      :scheme-key="schemeKey"
    />
  </template>
  <!-- implicit / password are not executable in a browser docs console; show nothing
       rather than falling through to a generic paste-a-credential input -->
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { IOauth2SecurityScheme } from '@stoplight/types'
import { isOauth2AuthorizationCodeFlow, isOauth2ClientCredentialsOrPasswordFlow } from '@/stoplight/elements-core/utils/oas/security'
import TryItAuth2ClientCredentials from '@/components/spec-document/try-it/TryItAuth2ClientCredentials.vue'
import TryItAuthCode from '@/components/spec-document/try-it/TryItAuthCode.vue'

const props = defineProps({
  schemeKey: {
    type: String,
    required: true,
  },
  dataId: {
    type: String,
    required: true,
  },
  scheme: {
    type: Object as PropType<IOauth2SecurityScheme>,
    required: true,
  },
})

const hasClientCredentialsFlow = computed((): boolean =>
  !!props.scheme.flows.clientCredentials &&
  isOauth2ClientCredentialsOrPasswordFlow(props.scheme.flows.clientCredentials))

const hasAuthorizationCodeFlow = computed((): boolean =>
  !!props.scheme.flows.authorizationCode &&
  isOauth2AuthorizationCodeFlow(props.scheme.flows.authorizationCode))
</script>
