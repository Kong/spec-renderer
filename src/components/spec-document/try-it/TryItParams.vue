<template>
  <CollapsablePanel
    v-if="security?.length"
    :data-testid="`tryit-params-${data.id}`"
  >
    <template #header>
      <h5>
        Parameters
      </h5>
    </template>

    <template #left>
      <label>Method</label>
      <select>
        <option
          v-for="sec in security"
          :key="sec.id"
        >
          {{ sec.key }} ({{ sec.type }})
        </option>
      </select>
    </template>

    <template #right>
      <label>Access Token</label>
      <input
        placeholder="App credential"
        @keyup="accessTokenChanged"
      >
    </template>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation, HttpSecurityScheme } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'


/**
 * This components handles path paramters, query paramters and body.
 * only parts of
 */
const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'request-params-changed'): void
}>()

const authHeaders = ref<Array<Record<string, string>>>()

/* for now we only have one header so we will return is as 1 element array */
const accessTokenChanged = (e: Event) => {
  const tokenValue = (e.target as HTMLInputElement).value
  authHeaders.value = []
  if (tokenValue) {
    authHeaders.value.push({
      name: 'Authorization',
      // TODO: this might be a query string, not a header, handle this case
      value: `Bearer ${(e.target as HTMLInputElement).value}`,
    })
  }
  emit('access-tokens-changed', authHeaders.value)
}

const security = computed((): HttpSecurityScheme[]|undefined => {
  const secArray:Array<HttpSecurityScheme> = []
  if (props.data.security) {
    props.data.security.forEach((secGroup: HttpSecurityScheme[]) => {
      (secGroup || []).forEach((sec: HttpSecurityScheme) => {
        secArray.push(sec)
      })
    })
  }
  return secArray
})
</script>

