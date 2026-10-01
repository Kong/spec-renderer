<template>
  <div>
    <div class="param-wrapper">
      <InputLabel
        class="param-label"
        :for="`auth-input-oauth2-authorizationCode-clientId-${dataId}`"
      >
        Client ID
        <Tooltip
          v-if="scheme.description"
          :id="`auth-tooltip-oauth2-authorizationCode-clientId-${dataId}`"
          :text="scheme.description"
        />
      </InputLabel>
      <input
        :id="`auth-input-oauth2-authorizationCode-clientId-${dataId}`"
        v-model="authInputs[`${schemeKey}-clientId`]"
        :aria-describedby="`auth-input-oauth2-authorizationCode-clientId-${dataId}`"
        autocomplete="off"
        :disabled="status === 'authorizing'"
        placeholder="Enter Client ID"
        type="text"
      >
    </div>

    <div
      v-if="scopeEntries.length"
      class="param-wrapper"
    >
      <div class="button-wrapper">
        <InputLabel class="param-label">
          Scopes
        </InputLabel>
        <div>
          <button
            :aria-label="`Select all scopes for ${schemeKey}`"
            type="button"
            @click="setAllScopes(true)"
          >
            Select all
          </button>
          <button
            :aria-label="`Deselect all scopes for ${schemeKey}`"
            type="button"
            @click="setAllScopes(false)"
          >
            Deselect all
          </button>
        </div>
      </div>

      <div
        v-for="[scopeKey, scope] in scopeEntries"
        :key="scopeKey"
        class="scope-wrapper"
      >
        <input
          :id="`auth-input-oauth2-authorizationCode-scope-${scopeKey}-${dataId}`"
          v-model="authInputs[`${schemeKey}-authorizationCode-scope-${scopeKey}`]"
          :aria-describedby="`auth-input-oauth2-authorizationCode-scope-${scopeKey}-${dataId}`"
          autocomplete="off"
          type="checkbox"
        >
        <label :for="`auth-input-oauth2-authorizationCode-scope-${scopeKey}-${dataId}`">
          <span class="key-span">{{ scopeKey }}</span> - {{ scope }}
        </label>
      </div>
    </div>

    <div class="action-row">
      <button
        class="button-default"
        :data-testid="`tryit-auth-authorize-${dataId}`"
        :disabled="authorizeDisabled"
        type="button"
        @click="onAuthorizeClick"
      >
        {{ token ? 'Re-authorize' : 'Authorize' }}
      </button>
      <button
        v-if="token"
        class="button-default tertiary"
        :data-testid="`tryit-auth-clear-${dataId}`"
        type="button"
        @click="onClearCredentials"
      >
        Clear credentials
      </button>
    </div>
    <div
      v-if="signInHost"
      class="auth-hint"
      :data-testid="`tryit-auth-signin-host-${dataId}`"
    >
      You'll sign in at {{ signInHost }}
    </div>
    <div
      v-if="!target"
      class="auth-hint"
      :data-testid="`tryit-auth-bad-target-${dataId}`"
    >
      This scheme's authorization or token URL is missing or not an absolute http(s) URL, so sign-in is unavailable.
    </div>

    <div
      v-if="error"
      class="auth-error"
      :data-testid="`tryit-auth-error-${dataId}`"
      role="alert"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'
import composables from '@/composables'
import { buildPkceTarget } from '@/utils/oauth-pkce'
import type { Oauth2AuthStatus, Oauth2PkceTarget, OauthToken } from '@/types'
import type { IOauth2SecurityScheme } from '@stoplight/types'

const { schemeKey, dataId, scheme } = defineProps<{
  schemeKey: string
  dataId: string
  scheme: IOauth2SecurityScheme
}>()

// default keeps the panel working standalone and as a bare custom element
const oauthRedirectUri = inject('oauth-redirect-uri', computed(() => ''))

const { authInputs } = composables.useAuth()
const { statusFor, tokenFor, errorFor, authorize, clearCredentials } = composables.useOAuthPkce()

// the client ID key is shared with the client credentials panel on purpose
const clientId = computed<string>(() => authInputs.value[`${schemeKey}-clientId`] || '')
const target = computed<Oauth2PkceTarget | undefined>(() => buildPkceTarget(scheme, clientId.value))
const status = computed<Oauth2AuthStatus>(() => target.value ? statusFor(target.value) : 'unauthenticated')
const error = computed<string | undefined>(() => target.value ? errorFor(target.value) : undefined)
const token = computed<OauthToken | undefined>(() => target.value ? tokenFor(target.value) : undefined)
// buildPkceTarget guarantees an absolute http(s) URL
const signInHost = computed<string>(() => target.value ? new URL(target.value.authorizationUrl).host : '')

const authorizeDisabled = computed<boolean>(() => !target.value || !clientId.value || !oauthRedirectUri.value || status.value === 'authorizing')

// the http-spec transform drops per-operation scopes, so all scheme-level scopes are offered
const scopeEntries = computed<Array<[string, string]>>(() => Object.entries(scheme.flows.authorizationCode?.scopes || {}))

// namespaced, since the client credentials panel collects every `${schemeKey}-scope-*` key
const scopeKeyPrefix = computed<string>(() => `${schemeKey}-authorizationCode-scope-`)

const setAllScopes = (value: boolean) => {
  scopeEntries.value.forEach(([scopeKey]) => {
    authInputs.value[`${scopeKeyPrefix.value}${scopeKey}`] = value ? 'true' : 'false'
  })
}

const selectedScopes = computed<string[]>(() => Object.keys(authInputs.value)
  .filter(key => key.startsWith(scopeKeyPrefix.value))
  .filter(key => authInputs.value[key]?.toString() === 'true')
  .map(key => key.slice(scopeKeyPrefix.value.length)))

// no await before authorize: the popup must open inside the click or browsers block it
const onAuthorizeClick = (): void => {
  const t = target.value
  if (!t) {
    return
  }
  void authorize({
    target: t,
    clientId: clientId.value,
    scopes: selectedScopes.value,
    redirectUri: oauthRedirectUri.value,
  })
}

const onClearCredentials = (): void => {
  const t = target.value
  if (t) {
    clearCredentials(t)
  }
}

// only an expired token blocks the request, anything else is sent as is
composables.usePreRequestAuth().registerPreRequestAuth(schemeKey, async () => {
  const t = target.value
  return t && statusFor(t) === 'expired'
    ? { ok: false, error: new Error('Your session expired. Click Authorize to sign in again.') }
    : { ok: true }
})
</script>

<style lang="scss" scoped>
.panel-body {
  @include try-it-auth-fields;

  .action-row {
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
    margin-bottom: var(--kui-space-20, $kui-space-20);
    margin-top: var(--kui-space-30, $kui-space-30);

    .button-default {
      @include button-default;

      // the mixin has no disabled state, and Authorize is often disabled
      &:disabled {
        background-color: var(--kui-color-background-disabled, $kui-color-background-disabled);
        color: var(--kui-color-text-disabled, $kui-color-text-disabled);
        cursor: not-allowed;
      }
    }
  }

  .auth-hint {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    margin-top: var(--kui-space-30, $kui-space-30);
  }

  .auth-error {
    background-color: var(--kui-color-background-danger-weakest, $kui-color-background-danger-weakest);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    color: var(--kui-color-text-danger, $kui-color-text-danger);
    font-family: var(--kui-font-family-code, $kui-font-family-code);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    margin-top: var(--kui-space-30, $kui-space-30);
    overflow-wrap: anywhere;
    padding: var(--kui-space-30, $kui-space-30) var(--kui-space-40, $kui-space-40);
    white-space: pre-wrap;
  }
}
</style>
