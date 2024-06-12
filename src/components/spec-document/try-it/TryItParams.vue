<template>
  <CollapsablePanel
    v-if="params?.length"
    :data-testid="`tryit-params-${props.paramType}-${data.id}`"
  >
    <template #header>
      <h5>
        {{ compTitles[props.paramType] }}
      </h5>
    </template>

    <div
      v-for="p in params"
      :key="`${p.name}${paramType}`"
      class="wide"
    >
      <label>
        <span v-if="p.required">
          *
        </span>
        {{ p.name }}
      </label>
      <input
        :v-model="fieldValues[p.name]"
        :value="fieldValues[p.name]"
      >
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation, IHttpPathParam } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import { extractSample } from '@/utils'

/**
 * This components handles path parameters, query parameters and body.
 * only parts of
 */
const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  paramType: {
    type: String as PropType<'path' | 'body' | 'query'>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'request-params-changed'): void
}>()

const compTitles = {
  path: 'Path Parameters',
  query: 'Query Parameters',
  body: 'Body',
}

//@ts-ignore
console.log('zzzz:', props.data?.request?.path)

const params = computed((): IHttpPathParam[] | undefined => {
  console.log('qqqq', props.paramType)
  if (props.paramType === 'query') {

    return []
  }
  if (props.paramType === 'path') {
    console.log('setting to ', props.data.request?.path)
    return props.data.request?.path
  }
  // this is for 'body'
  return []
})

const fieldValues = ref<Record<string, string>>({})


// this is to calculate initial values for the fields
watch(params, () => {
  const samples = extractSample(params.value)
  console.log('aaaaaaa', params.value, samples)
  params.value?.forEach((p) => {
    fieldValues.value[p.name] = samples[p.name]
  })
  console.log('final:', fieldValues.value)
}, { immediate: true })

// this is to fire event when fieldValues changed
watch(fieldValues, () => {

})

</script>

