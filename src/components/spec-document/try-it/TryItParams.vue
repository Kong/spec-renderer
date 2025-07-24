<template>
  <CollapsablePanel
    v-show="params && Object.keys(params).length"
    class="try-it-params"
    :content-to-copy="contentToCopy"
    :data-testid="`tryit-params-${paramType}-${data.id}`"
    :start-collapsed="paramType !== 'body'"
  >
    <template #header>
      <h3>
        {{ compTitles[props.paramType] }}
      </h3>
    </template>
    <div
      v-if="paramType !== 'body' && params && Object.keys(params).length"
      class="wide"
    >
      <div
        v-for="pKey in Object.keys(params)"
        :key="`${params[pKey].name}${paramType}`"
      >
        <InputLabel
          class="param-label"
          :for="`request-${paramType}-input-${params[pKey].name || pKey}-${data.id}`"
        >
          <div
            v-if="params[pKey].required"
            class="required-label"
          >
            *
          </div>
          {{ params[pKey].name || pKey }}
          <Tooltip
            v-if="params[pKey].description"
            :id="`request-${paramType}-tooltip-${params[pKey].name || pKey}-${data.id}`"
          >
            <template #content>
              <MarkdownRenderer
                :markdown="params[pKey].description"
              />
            </template>
          </Tooltip>
        </InputLabel>
        <input
          :id="`request-${paramType}-input-${params[pKey].name || pKey}-${data.id}`"
          v-model="fieldValues[pKey]"
          :aria-describedby="`request-${paramType}-tooltip-${params[pKey].name || pKey}-${data.id}`"
          autocomplete="off"
          :data-testid="`tryit-${paramType}-param-${pKey}-${data.id}`"
          type="text"
        >
      </div>
    </div>

    <div
      v-if="paramType === 'body' && params && Object.keys(params).length"
      class="wide body-param"
    >
      <RequiredToggle
        v-if="!requestBody.isBinary"
        v-model="excludeNotRequired"
        class="required-fields-toggle"
        :data="data"
      />

      <EditableCodeBlock
        v-if="!requestBody.isBinary"
        class="body-param-code-block"
        :code="fieldValues.body"
        lang="json"
        @request-body-changed="requestBodyChanged"
      />
      <div
        v-else
      >
        <button
          class="choose-file-btn"
          type="button"
          @click="openFileDialog()"
        >
          Choose file
        </button>
        <span
          v-if="!selectedFiles"
          class="choose-file-text"
        >No file selected</span>
        <span
          v-if="selectedFiles && selectedFiles.length > 0"
          class="choose-file-text"
        >{{ selectedFiles[0].name }}</span>
      </div>
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { useFileDialog } from '@vueuse/core'
import type { IHttpOperation, IHttpPathParam, IHttpQueryParam } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import { extractSample, getSampleHeaders, getSamplePath, getSampleQuery } from '@/utils'
import type { RequestParamTypes } from '@/types'
import EditableCodeBlock from '@/components/common/EditableCodeBlock.vue'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import RequiredToggle from './RequiredToggle.vue'
import type { RequestBody } from '@/types'
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
    type: Object as PropType<RequestBody>,
    default: () => ({ text: '' }),
  },
  /** list of headers to exclude from TryIt */
  excludeHeaderList: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
})

const excludeNotRequired = defineModel({
  type: Boolean,
  default: true,
})

const emit = defineEmits<{
  (e: 'request-path-changed', newPath: string): void
  (e: 'request-query-changed', newQuery: string): void
  (e: 'request-headers-changed', newHeaders: Array<Record<string, string>>): void
  (e: 'request-body-changed', newBody: RequestBody): void
}>()

const compTitles = {
  path: 'Path Parameters',
  query: 'Query Parameters',
  body: 'Body',
  headers: 'Headers',
}


const { files: selectedFiles, open: openFileDialog, onChange: onChangeFileDialog } = useFileDialog({
  accept: props.requestBody?.acceptedExt,
  directory: false,
  reset: true,
  multiple: false,

})

onChangeFileDialog((files) => {
  /** do something with files */
  console.log('files: ', files)
  emit('request-body-changed', { isBinary: true, content: files as FileList })
})


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

  if (props.paramType === 'headers') {
    return props.data.request?.headers?.reduce((acc: Record<string, IHttpPathParam>, current: IHttpPathParam) => {
      if (!props.excludeHeaderList.includes(current.name)) {
        acc[current.name] = current
      }
      return acc
    }, {})
  }

  if (props.paramType === 'body') {
    if (props.requestBody.isBinary) {
      return <Record<string, any>>{ body: {} }
    } else if (props.requestBody.content) {
      return <Record<string, any>>{ body: { example: props.requestBody.content } }
    }
  }

  return <Record<string, any>>{}
})


//
const fieldValues = ref<Record<string, string>>({})

const contentToCopy = computed((): string => {
  if (props.paramType !== 'body') {
    return ''
  }
  return fieldValues.value.body
})

// calculating initial values for the fields,
watch(params, (newParams) => {
  if (newParams) {
    const samples = extractSample(newParams)
    Object.keys(newParams).forEach(key => {
      fieldValues.value[key] = samples[key]
    })
  }
}, { immediate: true })

const requestBodyChanged = (newBody: string) => {
  if (newBody) {
    emit('request-body-changed', { isBinary: false, content: newBody })
  }
}

// this is to fire event when fieldValues changed
watch(fieldValues, (newFieldValues) => {
  if (props.paramType === 'path') {
    emit('request-path-changed', getSamplePath(props.data, newFieldValues))
    return
  }
  if (props.paramType === 'query') {
    emit('request-query-changed', getSampleQuery(props.data, newFieldValues))
  }
  if (props.paramType === 'headers') {
    emit( 'request-headers-changed', getSampleHeaders({ data: props.data, fieldValues: newFieldValues, excludeHeaderList: props.excludeHeaderList }))
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.try-it-params {
  .param-label {
    margin-bottom: var(--kui-space-40, $kui-space-40);
  }

  .wide.body-param {
    // remove flex gap and margin inherited from CollapsablePanel
    gap: 0px;
    margin: var(--kui-space-0, $kui-space-0);

    .required-fields-toggle {
      border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      margin: var(--kui-space-0, $kui-space-0);
      padding: var(--kui-space-60, $kui-space-60) var(--kui-space-50, $kui-space-50);
    }

    .body-param-code-block {
      // remove border-radius inherited from pre mixin in mixins/_code.scss
      :deep(pre) {
        border-radius: var(--kui-border-radius-0, $kui-border-radius-0);
      }
    }
  }
}

input[type=text] {
  @include input-default;
}
.choose-file-btn {
  width: var(--kui-space-150, $kui-space-150);
  margin: var(--kui-space-60, $kui-space-60) var(--kui-space-30, $kui-space-30)!important;
  cursor: pointer;
}
.choose-file-text {
      font-size: var(--kui-font-size-20, $kui-font-size-20);
}
.required-label {
  color: var(--kui-icon-color-danger, $kui-icon-color-danger);
  height: 14px;
}
</style>

