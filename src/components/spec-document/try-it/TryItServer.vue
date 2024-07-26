<template>
  <CollapsablePanel
    v-if="serverVariables"
    :data-testid="`tryit-server-${data.id}`"
  >
    <template #header>
      <h3>
        Server
      </h3>
    </template>

    <div
      v-for="key in Object.keys(serverVariables)"
      :key="key"
      class="short"
    >
      <InputLabel :for="`server-input-${key}-${data.id}`">
        {{ key }}
        <Tooltip
          v-if="serverVariables[key].description"
          :id="`server-tooltip-${key}-${data.id}`"
          :text="serverVariables[key].description"
        />
      </InputLabel>
      <input
        :id="`server-input-${key}-${data.id}`"
        v-model="fieldValues[key]"
        :aria-describedby="`server-tooltip-${key}-${data.id}`"
        autocomplete="off"
        :data-testid="`tryit-server-${key}-${data.id}`"
        :placeholder="serverVariables[key].default"
        type="text"
      >
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation, INodeVariable } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'


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

const fieldValues = ref<Record<string,string>>({})

watch(fieldValues, () => {
  let newServerUrl = props.serverUrl

  Object.keys(serverVariables.value || {}).forEach(key => {

    const fieldValue = fieldValues.value[key] || serverVariables.value?.[key]?.default || ''
    newServerUrl = newServerUrl.replaceAll(`{${key}}`, fieldValue)
  })
  emit('server-url-changed', newServerUrl)
}, { deep: true })
</script>

<style lang="scss" scoped>
input[type=text] {
  @include input-default;
}
</style>

