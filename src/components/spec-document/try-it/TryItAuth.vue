<template>
  <CollapsablePanel
    v-if="securitySchemeGroupList?.length && data.path"
    class="try-it-auth"
    :data-testid="`tryit-auth-${data.id}`"
  >
    <template #header>
      <LockIcon
        :color="`var(--kui-color-text-neutral, ${KUI_COLOR_TEXT_NEUTRAL})`"
        :size="20"
      />
      <h3>
        Authentication
      </h3>

      <LabelBadge
        v-if="pkceTargets.length > 0"
        :data-testid="`tryit-auth-status-${data.id}`"
        :label="pkceStatusMeta[pkceAggregateStatus].label"
        size="small"
        :type="pkceStatusMeta[pkceAggregateStatus].type"
      />

      <SelectDropdown
        v-if="securitySchemeGroupSelectItems.length > 1"
        :id="`tryit-scheme-selector-${data.id}`"
        v-model="currentSecurityScheme"
        class="scheme-selector"
        :items="securitySchemeGroupSelectItems"
        placement="bottom-end"
      />
    </template>

    <!-- body -->
    <div
      v-for="(scheme, key) in currentSecuritySchemeMap"
      :key="scheme.id"
      class="wide"
    >
      <div
        v-if="scheme.type === 'http' && scheme.scheme === 'basic'"
      >
        <div class="param-wrapper">
          <InputLabel
            class="param-label"
            :for="`auth-token-input-basic-username-${data.id}`"
          >
            Username
            <Tooltip
              v-if="scheme.description"
              :id="`auth-token-tooltip-basic-username-${data.id}`"
              :text="scheme.description"
            />
          </InputLabel>
          <input
            :id="`auth-token-input-basic-username-${data.id}`"
            v-model="authInputs[`${key}-username`]"
            :aria-describedby="`auth-token-tooltip-basic-username-${data.id}`"
            autocomplete="off"
            placeholder="Enter Username"
            type="text"
          >
        </div>
        <div class="param-wrapper">
          <InputLabel
            class="param-label"
            :for="`auth-token-input-basic-password-${data.id}`"
          >
            Password
            <Tooltip
              v-if="scheme.description"
              :id="`auth-token-tooltip-basic-password-${data.id}`"
              :text="scheme.description"
            />
          </InputLabel>
          <div class="input-wrapper">
            <input
              :id="`auth-token-input-basic-password-${data.id}`"
              v-model="authInputs[`${key}-password`]"
              :aria-describedby="`auth-token-tooltip-basic-password-${data.id}`"
              autocomplete="off"
              placeholder="Enter Password"
              :type="showFields[`${key}-password`] ? 'text' : 'password'"
            >
            <VisibilityToggleButton
              v-model="showFields[`${key}-password`]"
              class="visibility-toggle-btn"
              label="password"
            />
          </div>
        </div>
      </div>

      <div
        v-else-if="scheme.type === 'http' && scheme.scheme === 'bearer'"
      >
        <div class="param-wrapper">
          <InputLabel
            class="param-label"
            :for="`auth-token-input-bearer-token-${data.id}`"
          >
            JWT token
            <Tooltip
              v-if="scheme.description"
              :id="`auth-token-tooltip-bearer-token-${data.id}`"
              :text="scheme.description"
            />
          </InputLabel>
          <div class="input-wrapper">
            <input
              :id="`auth-token-input-bearer-token-${data.id}`"
              v-model="authInputs[`${key}-token`]"
              :aria-describedby="`auth-token-tooltip-bearer-token-${data.id}`"
              autocomplete="off"
              placeholder="Enter JWT token"
              :type="showFields[`${key}-token`] ? 'text' : 'password'"
            >
            <VisibilityToggleButton
              v-model="showFields[`${key}-token`]"
              class="visibility-toggle-btn"
              label="token"
            />
          </div>
        </div>
      </div>

      <TryItAuth2
        v-else-if="scheme.type === 'oauth2'"
        :data-id="data.id"
        :scheme="scheme"
        :scheme-key="key"
      />

      <div
        v-else
      >
        <div class="param-wrapper">
          <InputLabel
            class="param-label"
            :for="`auth-token-input-${getSchemeLabel(scheme)}-${data.id}`"
          >
            {{ getSchemeLabel(scheme) }}
            <Tooltip
              v-if="scheme.description"
              :id="`auth-token-tooltip-${getSchemeLabel(scheme)}-${data.id}`"
              :text="scheme.description"
            />
          </InputLabel>
          <div class="input-wrapper">
            <input
              :id="`auth-token-input-${getSchemeLabel(scheme)}-${data.id}`"
              v-model="authInputs[`${key}-token`]"
              :aria-describedby="`auth-token-tooltip-${getSchemeLabel(scheme)}-${data.id}`"
              autocomplete="off"
              placeholder="App credential"
              :type="showFields[`${key}-token`] ? 'text' : 'password'"
            >
            <VisibilityToggleButton
              v-model="showFields[`${key}-token`]"
              class="visibility-toggle-btn"
              label="credential"
            />
          </div>
        </div>
      </div>
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, inject, watch, ref } from 'vue'
import type { ComputedRef, PropType } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { LockIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import VisibilityToggleButton from '@/components/common/VisibilityToggleButton.vue'
import type { IHttpOperation, HttpSecurityScheme, IOauth2SecurityScheme } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import LabelBadge from '@/components/common/LabelBadge.vue'
import { buildPkceTarget } from '@/utils/oauth-pkce'
import type { SecuritySchemeGroup, SelectItem, AuthPreflightResult, Oauth2AuthStatus, Oauth2PkceTarget, LabelBadgeType } from '@/types'
import composables from '@/composables'
import TryItAuth2 from './TryItAuth2.vue'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const { runPreflight } = composables.useAuthPreflight()

/**
 * Runs the registered pre-request handlers (e.g. OAuth2 client-credentials token
 * acquisition) for every scheme in the active security requirement, then - like
 * `auth2ClientCredentialsAuth` above - resyncs the combined headers/query immediately,
 * before the input debounce runs.
 */
const runAuthPreflight = async (): Promise<AuthPreflightResult> => {
  const result = await runPreflight(Object.keys(currentSecuritySchemeMap.value))
  if (!result.error) {
    updateAuthDataImpl()
  }
  return result
}

/**
 * @deprecated Use `runAuthPreflight`. Retained as a thin wrapper so callers that need the
 * raw token response keep working; flow components now self-register their pre-request
 * handler with `useAuthPreflight` instead of being reached through a template ref.
 */
const auth2ClientCredentialsAuth = async (): Promise<Response | undefined> => {
  const result = await runAuthPreflight()
  if (result.error) {
    throw result.error
  }
  return result.response ?? ({ ok: true } as Response)
}

defineExpose({
  auth2ClientCredentialsAuth,
  runAuthPreflight,
})


const emit = defineEmits<{
  (e: 'security-scheme-changed', newScheme: string): void
}>()

const { activeSecurityScheme, authHeadersMap, authQueryMap, authInputs } = composables.useAuth()
const { aggregateStatus } = composables.useOAuthPkce()

// tracks which password fields are currently revealed; keyed by `${schemeKey}-fieldname`
const showFields = ref<Record<string, boolean>>({})

const securitySchemeGroupList = inject<ComputedRef<SecuritySchemeGroup[]>>('security-scheme-group-list', computed(() => []))
/**
 * Extracts the list of select-items for the security scheme group selector.
*/
const securitySchemeGroupSelectItems = computed<SelectItem[]>(() => {
  return securitySchemeGroupList.value.map((group) => ({
    label: group.title,
    value: group.key,
    key: group.key,
  }))
})

const currentSecurityScheme = ref<string>(props.data.security?.[0]?.[0]?.key || '')
/**
 * Key-value pair of scheme key and the corresponding scheme object.
 */
const currentSecuritySchemeMap = ref<Record<string, HttpSecurityScheme>>({})

/**
 * PKCE (authorizationCode) targets among the active security schemes - used to drive
 * the status badge in the panel header. Derived from `currentSecuritySchemeMap`, not
 * just the schemes currently rendering `TryItAuthCode`, so the badge reflects every
 * authorizationCode scheme in the active security requirement.
 */
const pkceTargets = computed((): Oauth2PkceTarget[] => Object.entries(currentSecuritySchemeMap.value)
  .filter(([, s]) => s.type === 'oauth2' && (s as IOauth2SecurityScheme).flows?.authorizationCode)
  .map(([key, s]) => buildPkceTarget(key, s as IOauth2SecurityScheme, authInputs.value[`${key}-clientId`] || ''))
  .filter((t): t is Oauth2PkceTarget => !!t))

const pkceAggregateStatus = computed((): Oauth2AuthStatus => aggregateStatus(pkceTargets.value))

const pkceStatusMeta: Record<Oauth2AuthStatus, { label: string, type: LabelBadgeType }> = {
  unauthenticated: { label: 'Unauthenticated', type: 'neutral' },
  authorizing: { label: 'Authorizing…', type: 'primary' },
  authenticated: { label: 'Authenticated', type: 'success' },
  expired: { label: 'Expired', type: 'warning' },
}

/**
 * Update auth headers and queries for the current security requirement.
 */
const updateAuthDataImpl = () => {
  const headers: Array<Record<string, string>> = []
  const query: string[] = []

  const append = (name: string, value: string, schemeIn: string) => {
    if (schemeIn === 'query') {
      query.push(`${name}=${value}`)
    } else {
      headers.push({ name, value })
    }
  }

  for (const [key, scheme] of Object.entries(currentSecuritySchemeMap.value)) {

    // @ts-ignore `in` is valid attribute of the schema
    const schemeIn = scheme.in

    // The token is acquired in TryItAuth2.vue, but it must still be included
    // when this security requirement contains multiple schemes. Both the
    // clientCredentials and authorizationCode (PKCE) flows store their token in
    // authInputs[`${key}-token`] as the full "Bearer <token>" string, so one branch
    // serves both flows.
    if (scheme.type === 'oauth2') {
      append('Authorization', authInputs.value[`${key}-token`] || 'Bearer', schemeIn)
      continue
    }

    if (scheme.type === 'http' && scheme.scheme === 'basic') {
      const username = authInputs.value[`${key}-username`] || ''
      const password = authInputs.value[`${key}-password`] || ''
      const basicAuthValue = btoa(`${username}:${password}`)
      // if the scheme is in header, we add it to the headers
      append('Authorization', `Basic ${basicAuthValue}`, schemeIn)

    } else if (scheme.type === 'http' && scheme.scheme === 'bearer') {
      const value = authInputs.value[`${key}-token`] || ''
      append('Authorization', `Bearer ${value}`, schemeIn)

    } else {
      const value = authInputs.value[`${key}-token`] || ''
      // @ts-ignore `name` is valid attribute of the schema
      append(scheme.name || 'Authorization', value, schemeIn)
    }
  }

  // Requests select credentials by security requirement (an AND group), not
  // by an individual scheme. For a single-scheme requirement the keys match,
  // which previously hid this bug.
  authHeadersMap.value[currentSecurityScheme.value] = headers
  authQueryMap.value[currentSecurityScheme.value] = query.join('&')
}

const updateAuthData = useDebounceFn(updateAuthDataImpl, 100)

const getSchemeLabel = (scheme: HttpSecurityScheme, defaultName?: string): string => {
  //@ts-ignore `name` is valid property
  return scheme.name || scheme.bearerFormat || defaultName || 'Access Token'
}

/**
 * Keeps track of input values for the active security scheme.
 *
 * `authInputs can contain values for tokens from multiple security schemes,
 * but we only need to keep track of the tokens for the active security scheme.
 *
 * This reduces the number of times watchers will run for each TryItAuth component,
 * vs when we have a watcher for the entire `authInputs`.
 */

watch(authInputs, () => {
  // when authInputs change, we update the auth headers and queries
  updateAuthData()
}, { immediate: true, deep: true })

/**
 * Set when the scheme below was resolved by local fallback rather than chosen by the user,
 * so it is NOT pushed back to the shared `activeSecurityScheme`. Many operations are
 * mounted at once (`SpecDocument` renders a `v-for` of them), so if every operation pushed
 * its own group key to that global they would fight over it. Only a genuine dropdown pick
 * propagates across endpoints.
 */
let suppressGlobalSync = false

watch(currentSecurityScheme, (newScheme) => {
  if (!suppressGlobalSync) {
    activeSecurityScheme.value = newScheme
  }
  suppressGlobalSync = false
  emit('security-scheme-changed', newScheme)
  updateAuthData()
})

// when new security schema selected from the dropdown
watch(() => ({ key: activeSecurityScheme.value, list: securitySchemeGroupList.value }), () => {
  const groups = securitySchemeGroupList.value
  if (!groups.length) {
    return
  }

  // Prefer the globally selected group, so a scheme chosen on one operation carries across
  // endpoints. Fall back to this operation's own first group when it does not offer that
  // group at all - e.g. the global holds a bare `A` selected on another endpoint while this
  // operation's requirement is `A & B`, whose group key is `A-B`. The previous fallback
  // compared the group key against `security[0][0].key`, which only ever matched for
  // single-scheme requirements, so an AND group rendered an empty panel and sent no
  // auth headers.
  const matched = groups.find(group => group.key === activeSecurityScheme.value)
    ?? groups.find(group => group.key === currentSecurityScheme.value)
  const group = matched ?? groups[0]!

  const schemeMap: Record<string, HttpSecurityScheme> = {}
  group.schemeList.forEach((scheme) => {
    schemeMap[scheme.key] = scheme
  })
  currentSecuritySchemeMap.value = schemeMap

  if (currentSecurityScheme.value !== group.key) {
    // A local fallback must not clobber another endpoint's global selection.
    suppressGlobalSync = !matched
    currentSecurityScheme.value = group.key
  }
}, { immediate: true } )

</script>

<style lang="scss" scoped>

.try-it-auth {
  .kui-icon {
    margin-right: var(--kui-space-30, $kui-space-30)!important;
  }

  .param-wrapper {
    margin-bottom: var(--kui-space-40, $kui-space-40);

    &:first-child {
      margin-top: var(--kui-space-20, $kui-space-20);
    }

    &:last-child {
      margin-bottom: var(--kui-space-20, $kui-space-20);
    }

    .param-label {
      margin-bottom: var(--kui-space-30, $kui-space-30);
    }
  }


  .scheme-selector {
    margin-left: auto !important;

    :deep(.trigger-button) {
      @include small-bordered-trigger-button;
    }
  }

  input[type=text] {
    @include input-default;
  }

  .input-wrapper {
    align-items: center;
    display: flex;
    position: relative;

    input {
      flex: 1;
      @include input-default;
      padding-right: var(--kui-space-80, $kui-space-80);
    }

    .visibility-toggle-btn {
      padding-right: var(--kui-space-40, $kui-space-40);
      position: absolute;
      right: 0;
    }
  }
}
</style>
