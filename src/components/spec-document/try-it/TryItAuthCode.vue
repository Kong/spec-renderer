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
        :disabled="!clientId || status === 'authorizing' || !oauthRedirectUri"
        :title="!oauthRedirectUri ? 'The oauthRedirectUri prop must be set by the host application to enable OAuth sign-in.' : undefined"
        type="button"
        @click="onAuthorizeClick"
      >
        {{ status === 'unauthenticated' ? 'Authorize' : 'Re-authorize' }}
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
      v-if="!oauthRedirectUri"
      class="redirect-uri-hint"
    >
      OAuth sign-in requires the host application to configure the <span class="key-span">oauthRedirectUri</span> prop.
    </div>

    <TryItAuthError
      v-if="error"
      :data-id="dataId"
      :message="error.message"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, watch } from 'vue'
import type { ComputedRef, PropType } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'
import TryItAuthError from './TryItAuthError.vue'
import composables from '@/composables'
import { buildPkceTarget } from '@/utils/oauth-pkce'
import type { IOauth2SecurityScheme } from '@stoplight/types'

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

// Default provided so this component still works standalone (tests, or mounted as a
// bare custom element without a host app providing the redirect URI).
const oauthRedirectUri = inject<ComputedRef<string>>('oauth-redirect-uri', computed(() => ''))

const { authInputs } = composables.useAuth()
const { statusFor, tokenFor, errorFor, authorize, refresh, clearCredentials, precomputeChallenge } = composables.useOAuthPkce()
const { registerPreflight, unregisterPreflight } = composables.useAuthPreflight()

const clientId = computed(() => authInputs.value[`${props.schemeKey}-clientId`] || '')
const target = computed(() => buildPkceTarget(props.schemeKey, props.scheme, clientId.value))
const status = computed(() => target.value ? statusFor(target.value) : 'unauthenticated')
const error = computed(() => target.value ? errorFor(target.value) : undefined)
const token = computed(() => target.value ? tokenFor(target.value) : undefined)

// `@stoplight/http-spec`'s `transformFlows` loses the per-operation required scopes, so
// (same as TryItAuth2ClientCredentials) every scheme-level scope is offered here.
const scopeEntries = computed(() => Object.entries(props.scheme.flows.authorizationCode?.scopes || {}))

// Scopes are namespaced with `-authorizationCode-` because TryItAuth2ClientCredentials
// collects its own scopes with `key.startsWith(`${schemeKey}-scope-`)`, which would also
// match a bare `${schemeKey}-scope-${scopeKey}` key - an authorizationCode-only scope
// would then leak into the clientCredentials token request for a scheme declaring both
// flows. The longer, namespaced prefix keeps the two flows' scope selections isolated.
const setAllScopes = (value: boolean) => {
  scopeEntries.value.forEach(([scopeKey]) => {
    authInputs.value[`${props.schemeKey}-authorizationCode-scope-${scopeKey}`] = value ? 'true' : 'false'
  })
}

const selectedScopes = computed((): string[] => {
  const prefix = `${props.schemeKey}-authorizationCode-scope-`
  return Object.keys(authInputs.value)
    .filter(key => key.startsWith(prefix))
    .filter(key => authInputs.value[key]?.toString() === 'true')
    .map(key => key.replace(prefix, ''))
})

// Opens the pop-up synchronously (via `authorize()`) to preserve the click's user-activation
// flag - deliberately not `await`ed here.
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

// Best-effort warm-up so the SHA-256 digest is usually ready before the Authorize click.
const debouncedPrecompute = useDebounceFn(() => {
  if (target.value) {
    void precomputeChallenge(target.value)
  }
}, 300)

watch(clientId, () => {
  debouncedPrecompute()
}, { immediate: true })

// Silently refresh an expired token before a Try-It request goes out. Never opens a
// pop-up or navigates anywhere - authorization only ever happens from an explicit
// Authorize click.
onMounted(() => registerPreflight(props.schemeKey, async () => {
  const t = target.value
  if (!t || !tokenFor(t)) {
    return undefined // never authorized - send unauthenticated, as today
  }
  if (statusFor(t) !== 'expired') {
    return undefined
  }
  const ok = await refresh(t)
  return ok ? undefined : { ok: false, error: new Error(errorFor(t)?.message ?? 'Could not refresh the access token. Click Authorize to sign in again.') }
}))
onUnmounted(() => unregisterPreflight(props.schemeKey))
</script>

<style lang="scss" scoped>
.panel-body {
  .param-wrapper {
    margin-bottom: var(--kui-space-40, $kui-space-40);

    &:first-child {
      margin-top: var(--kui-space-20, $kui-space-20);
    }

    &:last-child {
      margin-bottom: var(--kui-space-20, $kui-space-20);
    }

    .button-wrapper {
      align-items: center;
      display: inline-flex;
      gap: var(--kui-space-20, $kui-space-20);
      justify-content: space-between;
      margin-bottom: var(--kui-space-30, $kui-space-30);
      margin-top: var(--kui-space-30, $kui-space-30);
      width: 100%;

      button {
        background: transparent;
        border: none;
        color: var(--kui-color-text-primary, $kui-color-text-primary);
        cursor: pointer;
        font-size: var(--kui-font-size-20, $kui-font-size-20);
        margin-left: var(--kui-space-20, $kui-space-20);
        margin-right: var(--kui-space-20, $kui-space-20);
        padding: 0;
        text-decoration: underline;
      }
    }
  }

  input[type=text] {
    @include input-default;
  }

  .scope-wrapper {
    align-items: center;
    display: flex;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    gap: var(--kui-space-20, $kui-space-20);
    line-height: 1.6;
    margin-bottom: var(--kui-space-20, $kui-space-20);

    input[type=checkbox] {
      cursor: pointer;
      height: 12px;
      width: 12px;
    }

    label {
      cursor: pointer;
    }

    .key-span {
      font-weight: bold;
      margin-left: var(--kui-space-20, $kui-space-20);
    }
  }
}

.action-row {
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
  margin-top: var(--kui-space-30, $kui-space-30);

  .button-default {
    @include button-default;
  }
}

.redirect-uri-hint {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  margin-top: var(--kui-space-30, $kui-space-30);

  .key-span {
    font-weight: bold;
  }
}
</style>
