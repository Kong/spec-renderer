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
        placeholder="Enter your application credentials"
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
      <input
        :id="`auth-input-oauth2-clientCredentials-secret-${dataId}`"
        v-model="authInputs[`${schemeKey}-clientSecret`]"
        :aria-describedby="`auth-input-oauth2-clientCredentials-secret-${dataId}`"
        autocomplete="off"
        placeholder="Enter your application credentials"
        type="password"
      >
    </div>
    <div
      v-if="scheme.flows.clientCredentials?.scopes"
      class="param-wrapper"
    >
      <InputLabel
        class="param-label"
        :for="`auth-input-oauth2-clientCredentials-secret-${dataId}`"
      >
        Scopes
        <button
          :aria-label="`Select all scopes for ${schemeKey}`"
          type="button"
          @click="setAllScopes(true)"
        >
          Select All
        </button>
        <button
          :aria-label="`Deselect all scopes for ${schemeKey}`"
          type="button"
          @click="setAllScopes(false)"
        >
          Select None
        </button>
      </InputLabel>

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
        >
        <label :for="`auth-input-oauth2-clientCredentials-scope-${scopeKey}-${dataId}`">
          <span class="key-span">{{ scopeKey }}</span> ({{ scope }})
        </label>
      </div>
    </div>

    <div class="buttons-wrapper">
      <div
        v-if="inProcess"
        class="loader"
      />
      <button
        :disabled="!authInputs[`${schemeKey}-clientId`] || !authInputs[`${schemeKey}-clientSecret`] || inProcess"
        @click="auth2ClientCredentialsAuth"
      >
        <span v-if="inProcess">Authorizing...</span>
        <span v-else-if="!authInputs[`${schemeKey}-token`]">Authorize</span>
        <span v-else>Refresh Token</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'
import composables from '@/composables'
import type { PropType } from 'vue'

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
const inProcess = ref(false)

const setAllScopes = (value: boolean) => {
  Object.keys(authInputs.value)
    .filter(key => key.startsWith(`${props.schemeKey}-scope-`))
    .forEach(key => {
      authInputs.value[key] = value ? 'true' : 'false'
    })
}

const auth2ClientCredentialsAuth = () => {
  const clientId = authInputs.value[`${props.schemeKey}-clientId`] || ''
  const clientSecret = authInputs.value[`${props.schemeKey}-clientSecret`] || ''
  const btoaValue = btoa(`${clientId}:${clientSecret}`)
  authInputs.value[`${props.schemeKey}-token`] = ''
  inProcess.value = true

  setTimeout(() => {
    inProcess.value = false
    authInputs.value[`${props.schemeKey}-token`] = 'Bearer xxxx' + Date.now()
    updateAuthData()
  }, 5000)
}

const updateAuthData = useDebounceFn(() => {
  const clientId = authInputs.value[`${props.schemeKey}-clientId`] || ''
  const clientSecret = authInputs.value[`${props.schemeKey}-clientSecret`] || ''

  if (!clientId || !clientSecret) {
    authInputs.value[`${props.schemeKey}-token`] = ''
  }

  // now we we got ourselves a token
  authHeadersMap.value[props.schemeKey] = [{
    name: 'Authorization', value: authInputs.value[`${props.schemeKey}-token`] || 'Bearer',
  }]
}, 100)

watch(() => ({
  clientId: authInputs.value[`${props.schemeKey}-clientId`],
  clientSecret: authInputs.value[`${props.schemeKey}-clientSecret`],
  scopes: Object.keys(authInputs.value)
    .filter(key => key.startsWith(`${props.schemeKey}-scope-`))
    .reduce((obj:Record<string, string>, key) => {
      obj[key] = authInputs.value[key]
      return obj
    }, {}),
}), () => {
  updateAuthData()
}, { immediate: true })

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

    .param-label {
      margin-bottom: var(--kui-space-30, $kui-space-30);
      button {
        border: none;
        background: transparent;
        color: var(--kui-color-text-primary, $kui-color-text-primary);
        cursor: pointer;
        font-size: var(--kui-font-size-20, $kui-font-size-20);
        margin-left: var(--kui-space-20, $kui-space-20);
        padding: 0;
        text-decoration: underline;
      }
    }
  }

  input[type=text], input[type=password] {
    @include input-default;
  }

  .buttons-wrapper {
    display: flex;
    justify-content: flex-end;
    margin: var(--kui-space-60, $kui-space-60) 0 var(--kui-space-20, $kui-space-20)!important;

    button {
      margin-left: var(--kui-space-20, $kui-space-20);
    }
  }
  .scope-wrapper {
    display: flex;
    align-items: center;
    gap: var(--kui-space-20, $kui-space-20);
    margin-bottom: var(--kui-space-20, $kui-space-20);
    font-size: var(--kui-font-size-20, $kui-font-size-20);

    input[type=checkbox] {
      width: 12px;
      height: 12px;
      cursor: pointer;
    }

    label {
      cursor: pointer;
    }
    .key-span {
      font-weight: bold;
      font-style: italic;
    }
  }
}
.loader {
  width: 100%;
  height: 6px;
  border-radius: 20px;
  color: var(--kui-color-background-primary-weak, $kui-color-background-primary-weak);
  border: var(--kui-border-width-20, $kui-border-width-20) solid;
  position: relative;
  margin-top: var(--kui-space-30, $kui-space-30)!important;
  margin-right: var(--kui-space-40, $kui-space-40)!important;
}
.loader::before {
  content: "";
  position: absolute;
  margin: var(--kui-space-10, $kui-space-10);
  inset: 0 100% 0 0;
  border-radius: inherit;
  background: currentColor;
  animation: l6 2s infinite;
}
@keyframes l6 {
    100% {inset:0}
}
</style>
