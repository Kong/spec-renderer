<template>
  <div>
    <div class="param-wrapper">
      <InputLabel
        class="param-label"
        :for="`auth-input-oauth2-clientCredentials-clientId-${dataId}`"
      >
        Client ID
        <Tooltip
          v-if="scheme.description"
          :id="`auth-tooltip-oauth2-clientCredentials-clientId-${dataId}`"
          :text="scheme.description"
        />
      </InputLabel>
      <input
        :id="`auth-input-oauth2-clientCredentials-clientId-${dataId}`"
        v-model="authInputs[`${schemeKey}-clientId`]"
        :aria-describedby="`auth-input-oauth2-clientCredentials-clientId-${dataId}`"
        autocomplete="off"
        placeholder="Enter Client ID"
        type="text"
      >
    </div>
    <div class="param-wrapper">
      <InputLabel
        class="param-label"
        :for="`auth-input-oauth2-clientCredentials-secret-${dataId}`"
      >
        Client Secret
        <Tooltip
          v-if="scheme.description"
          :id="`auth-tooltip-oauth2-clientCredentials-secret-${dataId}`"
          :text="scheme.description"
        />
      </InputLabel>
      <div class="input-wrapper">
        <input
          :id="`auth-input-oauth2-clientCredentials-secret-${dataId}`"
          v-model="authInputs[`${schemeKey}-clientSecret`]"
          :aria-describedby="`auth-input-oauth2-clientCredentials-secret-${dataId}`"
          autocomplete="off"
          placeholder="Enter Client Secret"
          :type="showClientSecret ? 'text' : 'password'"
        >
        <VisibilityToggleButton
          v-model="showClientSecret"
          class="visibility-toggle-btn"
          label="client secret"
        />
      </div>
    </div>
    <div
      v-if="extraTokenRequestParameters"
    >
      <div
        v-for="extraParam in extraTokenRequestParameters.filter(param => !param.hidden)"
        :key="extraParam.name"
        class="param-wrapper"
      >
        <InputLabel
          class="param-label param-label-extra"
          :for="`auth-input-oauth2-clientCredentials-${extraParam.name}-${dataId}`"
        >
          {{ extraParam.label || extraParam.name }}
          <div
            v-if="extraParam.required"
            class="required-label"
          >
            *
          </div>

          <Tooltip
            v-if="extraParam.description"
            :id="`auth-tooltip-oauth2-clientCredentials-${extraParam.name}-${dataId}`"
            :text="extraParam.description"
          />
        </InputLabel>
        <input
          :id="`auth-input-oauth2-clientCredentials-${extraParam.name}-${dataId}`"
          v-model="authInputs[`${schemeKey}-${extraParam.name}`]"
          :aria-describedby="`auth-input-oauth2-clientCredentials-${extraParam.name}-${dataId}`"
          autocomplete="off"
          :disabled="extraParam.readOnly"
          :placeholder="`Enter ${extraParam.label || extraParam.name}`"
          type="text"
        >
      </div>
      <div
        v-if="scheme.flows.clientCredentials?.scopes && Object.keys(scheme.flows.clientCredentials.scopes).length"
        class="param-wrapper"
      >
        <div class="button-wrapper">
          <InputLabel
            class="param-label"
            :for="`auth-input-oauth2-clientCredentials-secret-${dataId}`"
          >
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
          v-for="(scope, scopeKey) of scheme.flows.clientCredentials.scopes"
          :key="scope"
          class="scope-wrapper"
        >
          <input
            :id="`auth-input-oauth2-clientCredentials-scope-${scopeKey}-${dataId}`"
            v-model="authInputs[`${schemeKey}-scope-${scopeKey}`]"
            :aria-describedby="`auth-input-oauth2-clientCredentials-scope-${scopeKey}-${dataId}`"
            autocomplete="off"
            type="checkbox"
            @change="resetToken"
          >
          <label :for="`auth-input-oauth2-clientCredentials-scope-${scopeKey}-${dataId}`">
            <span class="key-span">{{ scopeKey }}</span> - {{ scope }}
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, computed, ref } from 'vue'
import VisibilityToggleButton from '@/components/common/VisibilityToggleButton.vue'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'
import composables from '@/composables'
import { useTimeoutFn } from '@vueuse/core'
import type { PropType } from 'vue'

import type { XKongClientCredentialsConfig, ExtraTokenRequestParameter } from '@/types'
import type { IOauth2SecurityScheme } from '@stoplight/types'
import { useDebounceFn } from '@vueuse/core'

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
    required: true },
})


const { authInputs, authHeadersMap } = composables.useAuth()

const showClientSecret = ref(false)

const resetToken = () => {
  authInputs.value[`${props.schemeKey}-token`] = ''
}

const extraTokenRequestParameters = computed((): ExtraTokenRequestParameter[] => (props.scheme.extensions?.['x-kong-client-credentials-config'] as XKongClientCredentialsConfig)?.extraTokenRequestParameters || [])

const setAllScopes = (value: boolean) => {
  Object.entries(props.scheme.flows.clientCredentials?.scopes || {}).forEach(([scopeKey]) => {
    authInputs.value[`${props.schemeKey}-scope-${scopeKey}`] = value ? 'true' : 'false'
  })
}

const auth2ClientCredentialsAuth = async (): Promise<Response | undefined> => {
  const clientId = authInputs.value[`${props.schemeKey}-clientId`] || ''
  const clientSecret = authInputs.value[`${props.schemeKey}-clientSecret`] || ''
  const btoaValue = btoa(`${clientId}:${clientSecret}`)
  const scopes:string[] = []
  if (authInputs.value[`${props.schemeKey}-token`]) {
    return
  }

  Object.keys(authInputs.value)
    .filter(key => key.startsWith(`${props.schemeKey}-scope-`))
    .forEach(key => {
      if (authInputs.value[key]?.toString() === 'true') {
        scopes.push(key.replace(`${props.schemeKey}-scope-`, ''))
      }
    })

  let extraParamError = ''
  const extraParams: Record<string, string> = { }
  for (const extraParam of extraTokenRequestParameters.value || []) {
    const key = `${props.schemeKey}-${extraParam.name}`
    if (extraParam.required && !authInputs.value[key]) {
      extraParamError += `Parameter ${extraParam.label || extraParam.name} is required in token request.\n`
      break
    }
    if (extraParam.omitIfEmpty && !authInputs.value[key]) {
      continue
    }
    extraParams[extraParam.name] = authInputs.value[key] || ''
  }

  if (extraParamError) {
    throw new Error(extraParamError)
  }
  const resp = await fetch(props.scheme.flows.clientCredentials?.tokenUrl || '', {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoaValue}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      ...(scopes.length ? { scope: scopes.join(' ') } : {}),
      ...extraParams,
    }),
  })

  if (resp.ok) {
    const resData = await resp.json()
    if (resData.access_token) {
      authInputs.value[`${props.schemeKey}-token`] = `${resData.token_type || 'Bearer'} ${resData.access_token}`
      await updateAuthDataImpl()
      useTimeoutFn(async () => {
        authInputs.value[`${props.schemeKey}-token`] = ''
        await updateAuthDataImpl()
      }, (resData.expires_in || 60) * 1000)
    }
  }
  return resp
}

defineExpose({
  auth2ClientCredentialsAuth,
})
const updateAuthDataImpl = async () => {
  const clientId = authInputs.value[`${props.schemeKey}-clientId`] || ''
  const clientSecret = authInputs.value[`${props.schemeKey}-clientSecret`] || ''

  if (!clientId || !clientSecret) {
    authInputs.value[`${props.schemeKey}-token`] = ''
  }

  // now we we got ourselves a token
  authHeadersMap.value[props.schemeKey] = [{
    name: 'Authorization', value: authInputs.value[`${props.schemeKey}-token`] || 'Bearer',
  }]
}
const updateAuthData = useDebounceFn(() => {
  updateAuthDataImpl()
}, 100)

watch(() => ({
  clientId: authInputs.value[`${props.schemeKey}-clientId`],
  clientSecret: authInputs.value[`${props.schemeKey}-clientSecret`],
}), () => {
  updateAuthData()
}, { immediate: true })

watch(extraTokenRequestParameters, (newValue) => {
  for (const extraParam of newValue || []) {
    const key = `${props.schemeKey}-${extraParam.name}`
    if (!(key in authInputs.value )) {
      authInputs.value[key] = extraParam.value || ''
    }
  }
}, { immediate: true, deep: true })

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
</style>
