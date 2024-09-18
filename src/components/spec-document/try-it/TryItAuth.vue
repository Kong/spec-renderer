<template>
  <CollapsablePanel
    v-if="securitySchemeGroupList?.length && data.path"
    :data-testid="`tryit-auth-${data.id}`"
  >
    <template #header>
      <LockIcon
        :color="KUI_COLOR_TEXT_NEUTRAL"
        :size="20"
      />
      <h3>
        Authentication
      </h3>

      <SelectDropdown
        v-if="securitySchemeGroupSelectItems.length > 1"
        :id="`tryit-scheme-selector-${data.id}`"
        v-model="activeSchemeGroupKey"
        class="scheme-selector"
        :items="securitySchemeGroupSelectItems"
        placement="bottom-end"
      />
    </template>

    <!-- body -->
    <div
      v-for="(scheme, i) in activeSecuritySchemeList"
      :key="scheme.id"
      class="wide"
    >
      <InputLabel :for="`auth-token-input-${getSchemeLabel(scheme)}-${data.id}`">
        {{ getSchemeLabel(scheme) }}
        <Tooltip
          v-if="scheme.description"
          :id="`auth-token-tooltip-${getSchemeLabel(scheme)}-${data.id}`"
          :text="scheme.description"
        />
      </InputLabel>
      <input
        :id="`auth-token-input-${getSchemeLabel(scheme)}-${data.id}`"
        v-model="tokenValues[i]"
        :aria-describedby="`auth-token-tooltip-${getSchemeLabel(scheme)}-${data.id}`"
        autocomplete="off"
        placeholder="App credential"
        type="text"
      >
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import type { PropType } from 'vue'
import { LockIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import type { IHttpOperation, HttpSecurityScheme } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import { useDebounceFn } from '@vueuse/core'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import composables from '@/composables'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const {
  tokenValues,
  securitySchemeGroupSelectItems,
  activeSecuritySchemeList,
  activeSchemeGroupKey,
  securitySchemeGroupList,
} = composables.useAuthTokenState()

const emit = defineEmits<{
  (e: 'access-tokens-changed', authHeaders: Array<Record<string, string>>, authQuery: string): void
}>()

const getSchemeLabel = (scheme: HttpSecurityScheme, defaultName?: string): string => {
  //@ts-ignore `name` is valid property
  return scheme.name || scheme.bearerFormat || defaultName || 'Access Token'
}

// when tokenValues changed we need to fire event to set security headers and queries
watch(tokenValues, (newValues) => {
  // do something
  const debouncedFn = useDebounceFn(()=> {
    const authHeaders:Array<Record<string, string>> = []
    const authQuery: Record<string, string> = {}
    newValues.forEach((tokenValue, i) => {
      if (activeSecuritySchemeList.value?.[i]) {
        const scheme: HttpSecurityScheme = activeSecuritySchemeList.value[i]
        // @ts-ignore `name` is valid attribute of the schema
        const schemeName = scheme.name
        // @ts-ignore `in` is valid attribute of the schema
        const schemeIn = scheme.in
        // @ts-ignore `scheme` is valid attribute of the schema
        const isBearer = scheme.scheme == 'bearer'
        if (scheme) {
          if (schemeIn === 'query') {
            authQuery[schemeName] = tokenValue
          } else {
            const headerName = isBearer || !schemeName ? 'Authorization' : schemeName
            authHeaders.push({
              name: headerName,
              value: `${isBearer ? 'Bearer ' : ''} ${tokenValue}`,
            })
          }
        }
      }
    })
    emit('access-tokens-changed', authHeaders, new URLSearchParams(authQuery).toString())
  }, 500)
  debouncedFn()
}, { deep: true,immediate: true })
</script>

<style lang="scss" scoped>
.kui-icon {
  margin-right: var(--kui-space-30, $kui-space-30)!important;
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
</style>
