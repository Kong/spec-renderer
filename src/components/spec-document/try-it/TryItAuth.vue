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
      v-for="(scheme, key) in activeSecuritySchemeMap"
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
        v-model="tokenValueMap[key]"
        :aria-describedby="`auth-token-tooltip-${getSchemeLabel(scheme)}-${data.id}`"
        autocomplete="off"
        placeholder="App credential"
        type="text"
        @input="handleTokenUpdate()"
      >
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { ComputedRef, PropType, Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { LockIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import type { IHttpOperation, HttpSecurityScheme } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import type { SecuritySchemeGroup, SelectItem } from '@/types'
import composables from '@/composables'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const { tokenValueMap, authHeaderMap, authQueryMap } = composables.useAuthTokenState()

const securitySchemeGroupList = inject<ComputedRef<Array<SecuritySchemeGroup>>>('security-scheme-group-list', computed(() => []))
const activeSchemeGroupKey = inject<Ref<string>>('active-scheme-group-key', ref(''))

const securitySchemeGroupSelectItems = computed<Array<SelectItem>>(() => {
  return securitySchemeGroupList.value.map((group) => ({
    label: group.title,
    value: group.key,
    key: group.key,
  }))
})

const activeSecuritySchemeMap = computed(() => {
  const schemeMap: Record<string, HttpSecurityScheme> = {}
  const schemeList = securitySchemeGroupList.value.find(group => group.key === activeSchemeGroupKey.value)?.schemeList ?? []

  schemeList.forEach((scheme) => {
    schemeMap[scheme.key] = scheme
  })

  return schemeMap
})


const handleTokenUpdate = useDebounceFn(() => {
  const headers:Array<Record<string, string>> = []
  const query: Record<string, string> = {}

  for (const schemeKey in activeSecuritySchemeMap.value) {
    const scheme = activeSecuritySchemeMap.value[schemeKey]

    if (scheme) {
      const tokenValue = tokenValueMap.value[schemeKey] ?? ''

      // @ts-ignore `name` is valid attribute of the schema
      const schemeName = scheme.name
      // @ts-ignore `in` is valid attribute of the schema
      const schemeIn = scheme.in
      // @ts-ignore `scheme` is valid attribute of the schema
      const isBearer = scheme.scheme == 'bearer'

      if (schemeIn === 'query') {
        query[schemeName] = tokenValue
      } else {
        const headerName = isBearer || !schemeName ? 'Authorization' : schemeName
        headers.push({
          name: headerName,
          value: `${isBearer ? 'Bearer' : ''} ${tokenValue}`,
        })
      }

    }
  }

  authHeaderMap.value[activeSchemeGroupKey.value] = headers
  authQueryMap.value[activeSchemeGroupKey.value] = new URLSearchParams(query).toString()
}, 500)

const getSchemeLabel = (scheme: HttpSecurityScheme, defaultName?: string): string => {
  //@ts-ignore `name` is valid property
  return scheme.name || scheme.bearerFormat || defaultName || 'Access Token'
}

watch(activeSchemeGroupKey, () => {
  handleTokenUpdate()
}, { immediate: true })
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
