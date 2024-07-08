<template>
  <CollapsablePanel
    v-if="securitySchemeList?.length"
    :data-testid="`tryit-auth-${data.id}`"
  >
    <template #header>
      <LockIcon
        v-if="securitySchemeList?.length"
        :color="KUI_COLOR_TEXT_NEUTRAL"
        :size="20"
      />
      <h5>
        Authentication
      </h5>

      <SelectDropdown
        v-if="securitySchemeList.length > 1"
        v-model="activeScheme"
        class="scheme-selector"
        :items="securitySchemeSelectItems"
        placement="bottom-end"
      />
    </template>

    <!-- body -->
    <div
      v-for="(scheme, i) in securityScheme"
      :key="scheme.id"
      class="wide"
    >
      <InputLabel>
        {{ getSchemeLabel(scheme) }}
        <Tooltip
          v-if="scheme.description"
          :id="`auth-token-tooltip-${getSchemeLabel(scheme)}-${data.id}`"
          :text="scheme.description"
        />
      </InputLabel>
      <input
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
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { LockIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import type { IHttpOperation, HttpSecurityScheme } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import { useDebounceFn } from '@vueuse/core'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import type { SelectItem } from '@/types'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'access-tokens-changed', authHeaders: Array<Record<string, string>>, authQuery: string): void
}>()

// this is the list, we grab first element for each scheme to present in the scheme selector
const securitySchemeList = computed((): HttpSecurityScheme[] | undefined => {
  const secArray: Array<HttpSecurityScheme> = []
  if (props.data.security) {
    props.data.security.forEach((secGroup: HttpSecurityScheme[]) => {
      secArray.push(secGroup[0])
    })
  }

  return secArray
})

const securitySchemeSelectItems = computed((): Array<SelectItem> => {
  return securitySchemeList.value?.map((scheme) => ({
    label: `${scheme.key} (${scheme.type})`,
    value: scheme.key,
    key: scheme.key,
  })) ?? []
})

const activeScheme = ref<string>(securitySchemeSelectItems.value[0].value)

// this is details for selected from the list - we grab all elements for schemeIdx
const securityScheme = ref<HttpSecurityScheme[] | undefined>([])

const getSchemeLabel = (scheme: HttpSecurityScheme, defaultName?: string): string => {
  //@ts-ignore `name` is valid property
  return scheme.name || scheme.bearerFormat || defaultName || 'Access Token'
}

const tokenValues = ref<string[]>([])

// when different security scheme selected we need to re-draw the form and reset the tokenValues
watch(activeScheme, (newIdx) => {
  securityScheme.value = props.data.security?.find((secGroup) => secGroup[0].key === newIdx)
  tokenValues.value = Array.from({ length: securityScheme.value?.length || 0 }, () => '')
}, { immediate: true })

// when tokenValues changed we need to fire event to set security headers and queries
watch(tokenValues, (newValues) => {
  // do something
  const debouncedFn = useDebounceFn(()=> {
    const authHeaders:Array<Record<string, string>> = []
    const authQuery = <Record<string, string>>{}
    newValues.forEach((tokenValue, i) => {
      if (securityScheme.value?.[i]) {
        const scheme: HttpSecurityScheme = securityScheme.value[i]
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
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    font-family: var(--kui-font-family-code, $kui-font-family-code);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
  }
}

input {
  @include input-default;
}
</style>
