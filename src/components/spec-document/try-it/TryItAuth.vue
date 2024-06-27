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

      <select
        v-if="securitySchemeList.length > 1"
        v-model="schemeIdx"
        class="scheme-selector"
      >
        <option
          v-for="(scheme, i) in securitySchemeList"
          :key="scheme.id"
          :value="i"
        >
          {{ scheme.key }} ({{ scheme.type }})
        </option>
      </select>
    </template>

    <!-- body -->
    <div
      v-for="(scheme, i) in securityScheme"
      :key="scheme.id"
      class="wide"
    >
      <label>
        {{ getSchemeLabel(scheme) }}
      </label>
      <input
        v-model="tokenValues[i]"
        placeholder="App credential"
        type="password"
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

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'access-tokens-changed', authHeaders: Array<Record<string, string>>, authQuery: string): void
}>()

const schemeIdx = ref<number>(0)


// this is the list, we grab first element for each scheme to present in the scheme selector
const securitySchemeList = computed((): HttpSecurityScheme[] | undefined => {

  const secArray:Array<HttpSecurityScheme> = []
  if (props.data.security) {
    props.data.security.forEach((secGroup: HttpSecurityScheme[]) => {
      secArray.push(secGroup[0])
    })
  }
  return secArray
})

// this is details for selected from the list - we grab all elements for schemeIdx
const securityScheme = ref < HttpSecurityScheme[] | undefined>([])

const getSchemeLabel = (scheme: HttpSecurityScheme, defaultName?: string): string => {
  //@ts-ignore `name` is valid property
  return scheme.name || scheme.bearerFormat || defaultName || 'Access Token'
}

const tokenValues = ref<string[]>([])

// when different security scheme selected we need to re-draw the form and reset the tokenValues
watch(schemeIdx, (newIdx) => {
  securityScheme.value = props.data.security?.[newIdx]
  console.log('aaaa:', securityScheme.value)
  tokenValues.value = Array.from({ length: securityScheme.value?.length || 0 }, () => '123')
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
        if (scheme && tokenValue) {
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
  margin-left: auto!important;;
}
</style>