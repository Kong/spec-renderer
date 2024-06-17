<template>
  <CollapsablePanel
    v-if="params&& Object.keys(params).length"
    :data-testid="`tryit-params-${props.paramType}-${data.id}`"
  >
    <template #header>
      <h5>
        {{ compTitles[props.paramType] }}
      </h5>
    </template>

    <div
      v-for="pKey in Object.keys(params)"
      :key="`${params[pKey].name}${paramType}`"
      class="wide"
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
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation, IMediaTypeContent, IHttpPathParam, IHttpQueryParam } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import { extractSample, getSamplePath, getSampleQuery, getSampleBody } from '@/utils'
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
  (e: 'request-body-changed', newBody: Record<string, any>): void
}>()

const compTitles = {
  path: 'Path Parameters',
  query: 'Query Parameters',
  body: 'Body',
}

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
  if (props.data.request?.body?.contents && props.data.request?.body?.contents.length > 0) {
    const resBody = ((props.data.request?.body?.contents[0]) as unknown as IMediaTypeContent).schema?.properties as Record<string, any>
    (((props.data.request?.body?.contents[0]) as unknown as IMediaTypeContent).schema?.required || []).forEach(r => {
      resBody[r].required = true
    })
    console.log('body:', props.data.request?.body?.contents)
    return resBody
  }
  return undefined
})

const fieldValues = ref<Record<string, string>>({})


// this is to calculate initial values for the fields
watch(params, () => {
  if (params.value) {
    const samples = extractSample(params.value)
    Object.keys(params.value).forEach(key => {
      fieldValues.value[key] = samples[key]
    })
  }
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
  if (props.paramType === 'body') {
    emit('request-body-changed', getSampleBody(props.data, fieldValues.value))
  }
}, { deep: true })

</script>

