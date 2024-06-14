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
        v-model="fieldValues[p.name]"
        :data-testid="`tryit-${paramType}-param-${p.name}-${data.id}`"
        :title="p.description"
      >
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation, IHttpPathParam, IHttpQueryParam } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import { extractSample, getSamplePath, getSampleQuery } from '@/utils'
import type { RequestParamTypes } from '@/types'

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
    type: String as PropType<RequestParamTypes>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'request-path-changed', newPath: string): void
  (e: 'request-query-changed', newQuery: string): void
}>()

const compTitles = {
  path: 'Path Parameters',
  query: 'Query Parameters',
  body: 'Body',
}

const params = computed((): IHttpPathParam[] | IHttpQueryParam[]| undefined => {
  if (props.paramType === 'query') {
    return props.data.request?.query
  }
  if (props.paramType === 'path') {
    return props.data.request?.path
  }
  // this is for 'body'
  return []
})

const fieldValues = ref<Record<string, string>>({})


// this is to calculate initial values for the fields
watch(params, () => {
  const samples = extractSample(params.value)
  params.value?.forEach((p) => {
    fieldValues.value[p.name] = samples[p.name]
  })
}, { immediate: true })

// this is to fire event when fieldValues changed
watch(fieldValues, () => {
  if (props.paramType === 'path') {
    emit('request-path-changed', getSamplePath(props.data, fieldValues.value))
    return
  }
  if (props.paramType === 'query') {
    emit('request-query-changed', getSampleQuery(props.data, fieldValues.value))
  }
}, { deep: true })

</script>

