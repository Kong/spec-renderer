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


// this is the list, we grab first element for each scheme
const securitySchemeList = computed((): HttpSecurityScheme[] | undefined => {

  const secArray:Array<HttpSecurityScheme> = []
  if (props.data.security) {
    props.data.security.forEach((secGroup: HttpSecurityScheme[]) => {
      secArray.push(secGroup[0])
    })
  }
  return secArray
})

// this is details for selected from the list - we grap all elements for schemeIdx
const securityScheme = computed((): HttpSecurityScheme[] | undefined => {
  const res = props.data.security?.[schemeIdx.value]
  return res
  // return [...res, ...[{
  //   'id': '3b4ad86dff71c' + (new Date()).getTime(),
  //   'type': 'apiKey',
  //   'in': 'query',
  //   'name': 'access_token',
  //   'key': 'global',
  //   'extensions': {},
  // }]]

})

const getSchemeLabel = (scheme: HttpSecurityScheme):string => {
  //@ts-ignore `name` is valid property
  return scheme.name || scheme.bearerFormat || 'Access Token'
}

const tokenValues = ref<Array<string>>([])

watch(securityScheme, (newScheme) => {
  if (newScheme) {
    tokenValues.value = Array.from({ length: newScheme.length }, () => '')
  }
}, { immediate: true })

watch(tokenValues, (newValues) => {
  const authHeaders:Array<Record<string, string>> = []
  const authQuery = <Record<string, string>>{}

  newValues.forEach((tokenValue, i) => {
    if (securityScheme.value?.[i]) {
      const scheme: HttpSecurityScheme = securityScheme.value[i]
      if (scheme && tokenValue) {
      // @ts-ignore `in` is valid attribute of the schema
        if (scheme.in === 'query') {
        // @ts-ignore `name` is valid attribute of the schema
          authQuery[scheme.name] = tokenValue
        } else {
          authHeaders.push({
            name: 'Authorization',
            value: `Bearer ${tokenValue}`,
          })
        }
      }
    }
  })
  emit('access-tokens-changed', authHeaders, new URLSearchParams(authQuery).toString())
}, { deep: true })
</script>

<style lang="scss" scoped>
.kui-icon {
  margin-right: var(--kui-space-30, $kui-space-30)!important;
}
.scheme-selector {
  margin-left: auto!important;;
}
</style>