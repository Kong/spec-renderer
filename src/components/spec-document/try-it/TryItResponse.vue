<template>
  <CollapsablePanel
    :collapsible="false"
    :data-testid="`tryit-response-${dataId}`"
  >
    <template #header>
      <div class="h-wrapper">
        <h3>
          <span v-if="!response?.status">
            Response
          </span>

          <span
            v-if="response?.status"
            :class="`response-status ${response?.ok}`"
          >
            {{ response?.status }}
          </span>
        </h3>
        <VisibilityToggleButton
          v-if="hasMaskedData && !props.responseError"
          v-model="showSensitiveData"
        />
      </div>
      <SelectDropdown
        :id="`response-option-select-${dataId}`"
        v-model="selectedResOption"
        class="res-option-selector"
        :items="resultOptions"
        placement="bottom-end"
      />
    </template>

    <div
      v-if="hasBodyResult && selectedResOption === 'body'"
      class="wide"
    >
      <TryItResponseDownload
        v-if="isBinaryResponse"
        :content-disposition="responseContentDisposition"
        :content-type="responseContentType"
        :data-id="dataId"
        :size="responseSize"
        :url="objectUrl || ''"
      />
      <component
        :is="responseBodyComponent.component"
        v-else
        v-bind="responseBodyComponent.props"
      />
    </div>

    <div
      v-if="errorText && selectedResOption === 'error'"
      class="wide"
    >
      <div class="error-panel">
        {{ errorText }}
        <div
          v-if="!response"
          class="cors-error"
        >
          Make sure CORS is enabled for the server.
        </div>
      </div>
    </div>

    <div
      v-if="headersText && selectedResOption === 'headers'"
      class="wide"
    >
      <CodeBlock
        :code="headersText"
        :is-resizable="true"
        lang="json"
      />
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useObjectUrl } from '@vueuse/core'
import CodeBlock from '@/components/common/CodeBlock.vue'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import type { PropType } from 'vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import type { SelectItem, SecuritySchemeMaskRule } from '@/types'
import { CODE_INDENT_SPACES } from '@/constants'
import type { IHttpOperationResponse } from '@stoplight/types'
import VisibilityToggleButton from '@/components/common/VisibilityToggleButton.vue'
import TryItResponseDownload from './TryItResponseDownload.vue'
import { maskBodyExample, findResponseSchema, hasMasking, isTextualContentType } from '@/utils'

const props = defineProps({
  dataId: {
    type: String,
    required: true,
  },
  response: {
    type: Object as PropType<Response>,
    default: () => { },
  },
  responseError: {
    type: Object as PropType<Error>,
    default: () => { },
  },
  maskRules: {
    type: Array as PropType<SecuritySchemeMaskRule[]>,
    default: () => [],
  },
  responseSchemas: {
    type: Array as PropType<IHttpOperationResponse[]>,
    default: () => [],
  },
})

const showSensitiveData = ref<boolean>(false)

// Response body - object for JSON, string for text; blob-backed for image/binary
const responseContent = ref<unknown>(null)
const responseBodyType = ref<'json' | 'image' | 'text' | 'binary' | ''>('')
// Resolved schema — needed for toggle visibility check and masked computation
const bodySchema = ref<Record<string, any> | undefined>()

// Blob for image & binary responses
const responseBlob = ref<Blob | undefined>()
const objectUrl = useObjectUrl(responseBlob)
// Metadata used to build the response download card
const responseContentType = ref<string>('')
const responseContentDisposition = ref<string | null>(null)
const responseSize = ref<number | null>(null)

const isBinaryResponse = computed((): boolean => responseBodyType.value === 'binary')
const isImageResponse = computed((): boolean => responseBodyType.value === 'image')

// The Result view has renderable content for text/json (responseText), images, and binary downloads
const hasBodyResult = computed((): boolean => !!responseText.value || isImageResponse.value || isBinaryResponse.value)

// Show the toggle only for the active view: body masking on Result, header masking on Headers.
const hasMaskedData = computed((): boolean => {
  if (selectedResOption.value === 'headers') {
    // show toggle only when an auth credential is actually present in the response headers
    return props.maskRules.some(r =>
      r.location === 'header' && !!(props.response?.headers.get(r.paramName.toLowerCase())),
    )
  }
  return hasMasking(bodySchema.value, [])
})

// Builds the masked body
const maskedResponseText = computed((): string | null => {
  if (responseBodyType.value !== 'json' || !bodySchema.value) return null
  return JSON.stringify(maskBodyExample(responseContent.value, bodySchema.value), null, CODE_INDENT_SPACES)
})

const responseText = computed((): string => {
  if (!showSensitiveData.value && maskedResponseText.value !== null) return maskedResponseText.value
  if (responseBodyType.value === 'json') return JSON.stringify(responseContent.value, null, CODE_INDENT_SPACES)
  return String(responseContent.value ?? '')
})

const errorText = computed((): string => {
  return props.responseError?.message || ''
})

const headersText = computed((): string => {
  const headers = <Record<string, any>>{}
  if (props.response) {
    for (const pair of props.response.headers.entries()) {
      if (!showSensitiveData.value) {
        const maskedRule = props.maskRules.find(r => r.location === 'header' && r.paramName.toLowerCase() === pair[0].toLowerCase())
        headers[pair[0]] = maskedRule ? maskedRule.placeholder : pair[1]
      } else {
        headers[pair[0]] = pair[1]
      }
    }
  }
  return Object.keys(headers).length ? JSON.stringify(headers, null, CODE_INDENT_SPACES) : ''
})

const resultOptions = computed((): SelectItem[] => {
  const opts = []
  if (hasBodyResult.value) {
    opts.push({ value: 'body', label: 'Result' })
  }

  if (headersText.value) {
    opts.push({ value: 'headers', label: 'Headers' })
  }

  if (errorText.value) {
    opts.push({ value: 'error', label: 'Error' })
  }

  return opts
})

const isResponseImage = computed(() => responseBodyType.value === 'image')

// Returns the component & props to be used to display the response body
const responseBodyComponent = computed(() => {
  if (isResponseImage.value) {
    return {
      component: 'img',
      props: {
        src: objectUrl.value,
        alt: 'response image',
        width: '300px',
      },
    }
  }

  return {
    component: CodeBlock,
    props: {
      code: responseText.value,
      lang: requestLang.value,
      class: 'response-body',
      isResizable: true,
    },
  }
})

const selectedResOption = ref<string>()

watch(resultOptions, (options) => {
  // Only reset when the active option (Result/Headers/Error) is no longer available to preserve selection across visibility toggles
  if (options.length && !options.some(o => o.value === selectedResOption.value)) {
    selectedResOption.value = options[0]?.value
  }
}, { immediate: true })

const requestLang = computed(() => responseBodyType.value === 'json' ? 'json' : 'text')

watch(() => props.response, async (res) => {
  if (res) {
    const contentType = res.headers.get('content-type') ?? ''
    responseContentType.value = contentType
    responseContentDisposition.value = res.headers.get('content-disposition')
    if (contentType.includes('/json')) {
      const json = await res.json()
      responseContent.value = json
      responseBodyType.value = 'json'
      responseBlob.value = undefined
      responseSize.value = null
      bodySchema.value = findResponseSchema(props.responseSchemas, res.status, contentType || 'application/json')
    } else if (contentType.includes('image')) {
      const blob = await res.blob()
      responseBlob.value = blob
      responseContent.value = null
      responseBodyType.value = 'image'
      responseSize.value = null
      bodySchema.value = undefined
    } else if (isTextualContentType(contentType)) {
      responseContent.value = await res.text()
      responseBodyType.value = 'text'
      responseBlob.value = undefined
      responseSize.value = null
      bodySchema.value = undefined
    } else {
      // binary response — offer as a download instead of decoding as text
      const blob = await res.blob()
      responseBlob.value = blob
      responseContent.value = null
      responseBodyType.value = 'binary'
      responseSize.value = Number(res.headers.get('content-length')) || blob.size || null
      bodySchema.value = undefined
    }
    // reset to first option (Result/Headers/Error) on each new response
    selectedResOption.value = resultOptions.value[0]?.value
  } else {
    responseContent.value = null
    responseBodyType.value = ''
    responseBlob.value = undefined
    responseContentType.value = ''
    responseContentDisposition.value = null
    responseSize.value = null
    bodySchema.value = undefined
  }
}, { immediate: true })

</script>

<style lang="scss" scoped>
.h-wrapper {
  align-items: center;
  display: flex;
  flex: 1;
  gap: var(--kui-space-40, $kui-space-40);

}

.response-status:before {
  color: var(--kui-color-text-danger, $kui-color-text-danger);
  content: '\25CF';
  font-size: var(--kui-font-size-60, $kui-font-size-60);
  margin-right: var(--kui-space-20, $kui-space-20);
}

.response-status.true:before {
  color: var(--kui-color-text-success, $kui-color-text-success);
}

.error-panel {
  background-color: var(--kui-color-background-danger-weakest, $kui-color-background-danger-weakest);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  color: var(--kui-color-text-danger, $kui-color-text-danger);
  font-family: var(--kui-font-family-code, $kui-font-family-code);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  padding: var(--kui-space-30, $kui-space-30) var(--kui-space-40, $kui-space-40);

  .cors-error {
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}

.res-option-selector {

  :deep(.trigger-button) {
    @include small-bordered-trigger-button;
  }
}

:deep(.response-body pre) {
  height: 200px;
}

h3 {
  @include collapsible-section-title;
}
</style>
