<template>
  <CollapsablePanel
    v-if="params&& Object.keys(params).length"
    :data-testid="`tryit-params-${paramType}-${data.id}`"
  >
    <template #header>
      <h5>
        {{ compTitles[props.paramType] }}
      </h5>
    </template>

    <div
      v-if="paramType !== 'body'"
      class="wide"
    >
      <div
        v-for="pKey in Object.keys(params)"
        :key="`${params[pKey].name}${paramType}`"
      >
        <label>
          <span v-if="params[pKey].required">
            *
          </span>
          {{ params[pKey].name || pKey }}
        </label>
        <input
          v-model="fieldValues[pKey]"
          :data-testid="`tryit-${paramType}-param-${pKey}-${data.id}`"
          :title="params[pKey].description"
        >
      </div>
    </div>
    <div
      v-else
      class="wide"
    >
      <EditableCodeBlock
        :code="fieldValues.body"
        @request-body-changed="requestBodyChanged"
      />
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
import EditableCodeBlock from '@/components/common/EditableCodeBlock.vue'

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
  /* coming as a property when request sample is picked in RequestSample */
  requestBody: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'request-path-changed', newPath: string): void
  (e: 'request-query-changed', newQuery: string): void
  (e: 'request-body-changed', newBody: string): void
}>()

const compTitles = {
  path: 'Path Parameters',
  query: 'Query Parameters',
  body: 'Body',
}

// params schema props extracted from data (schema) or received from outside controls (reqBody)
const params = computed((): Record<string, IHttpPathParam | IHttpQueryParam | Record<string, any>> | undefined => {
  if (props.paramType === 'query') {
    return props.data.request?.query?.reduce((acc: Record<string, IHttpQueryParam>, current: IHttpQueryParam) => {
      (acc[current.name] = current); return acc
    }, {})

  }
  if (props.paramType === 'path') {
    return props.data.request?.path?.reduce((acc: Record<string, IHttpPathParam>, current: IHttpPathParam) => {
      (acc[current.name] = current); return acc
    }, {})
  }
  if (props.requestBody) {
    return <Record<string, any>>{ body: { example: props.requestBody } }
  }
  return <Record<string, any>>{}
})

//
const fieldValues = ref<Record<string, string>>({})


// calculating initial values for the fields,
watch(params, () => {
  if (params.value) {
    const samples = extractSample(params.value)
    Object.keys(params.value).forEach(key => {
      fieldValues.value[key] = samples[key]
    })
  }
}, { immediate: true })

const requestBodyChanged = (newBody: string) => {
  emit('request-body-changed', newBody)
}

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

