<template>
  <CollapsablePanel
    v-if="serverVariables"
    :data-testid="`tryit-server-${data.id}`"
  >
    <template #header>
      <h5>
        Server
      </h5>
    </template>

    <template #left>
      <div
        v-for="v in leftVars"
        :key="v.key"
      >
        <label>{{ v.key }}</label>
        <input
          v-model="fieldValues[v.key]"
          :data-testid="`tryit-server-${v.key}`"
          :placeholder="v.value.default"
          :title="v.value.description"
          @keyup="serverUrlChanged"
        >
      </div>
    </template>

    <template #right>
      <div
        v-for="v in rightVars"
        :key="v.key"
      >
        <label>{{ v.key }}</label>
        <input
          v-model="fieldValues[v.key]"
          :data-testid="`tryit-server-${v.key}`"
          :placeholder="v.value.default"
          :title="v.value.description"
          @keyup="serverUrlChanged"
        >
      </div>
    </template>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation, INodeVariable } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'


const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  serverUrl: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'server-url-changed', serverUrl: string): void
}>()

const serverVariables = computed((): Record<string, INodeVariable> | undefined => {
  return props.data.servers?.find(s => s.url === props.serverUrl)?.variables
})

const leftVars = computed(() => {
  const vArray = []
  if (serverVariables.value) {
    for (let i = 0; i< Object.keys(serverVariables.value).length; i+=2) {
      const key = Object.keys(serverVariables.value)[i]
      vArray.push({ key, value: serverVariables.value[key] })

    }
  }
  return vArray
})

const rightVars = computed(() => {
  const vArray = []
  if (serverVariables.value) {
    for (let i = 1; i < Object.keys(serverVariables.value).length; i += 2) {
      const key = Object.keys(serverVariables.value)[i]
      vArray.push({ key, value: serverVariables.value[key] })

    }
  }
  return vArray
})

const fieldValues = ref<Record<string,string>>({})


const serverUrlChanged = () => {

  let newServerUrl = props.serverUrl

  Object.keys(fieldValues.value).forEach(key => {

    const fieldValue = fieldValues.value[key] || serverVariables.value?.[key]?.default || ''
    newServerUrl = newServerUrl.replaceAll(`{${key}}`, fieldValue)
  })
  emit('server-url-changed', newServerUrl)
}

</script>

