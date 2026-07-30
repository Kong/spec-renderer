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
      <BinaryResponse
        v-if="responseBodyType === 'binary'"
        :blob="responseBlob"
        :content-disposition="responseContentDisposition"
        :data-id="dataId"
      />
      <ImageResponse
        v-else-if="responseBodyType === 'image'"
        :blob="responseBlob"
      />
      <CodeResponse
        v-else
        :body-schema="bodySchema"
        :content="responseContent"
        :lang="responseBodyType === 'json' ? 'json' : 'text'"
        :show-sensitive-data="showSensitiveData"
      />
    </div>

    <div
      v-if="errorText && selectedResOption === 'error'"
      class="wide"
    >
      <ErrorResponse
        :response="response"
        :response-error="responseError"
      />
    </div>

    <div
      v-if="hasHeaders && selectedResOption === 'headers'"
      class="wide"
    >
      <HeadersResponse
        :mask-rules="maskRules"
        :response="response"
        :show-sensitive-data="showSensitiveData"
      />
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import type { PropType } from 'vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import type { SelectItem, SecuritySchemeMaskRule } from '@/types'
import type { IHttpOperationResponse } from '@stoplight/types'
import VisibilityToggleButton from '@/components/common/VisibilityToggleButton.vue'
import BinaryResponse from './response/BinaryResponse.vue'
import ImageResponse from './response/ImageResponse.vue'
import CodeResponse from './response/CodeResponse.vue'
import HeadersResponse from './response/HeadersResponse.vue'
import ErrorResponse from './response/ErrorResponse.vue'
import { findResponseSchema, hasMasking, isTextualContentType } from '@/utils'

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

// Response body - object for JSON, string for text; blob-backed for image/binary.
// Read once here (a Response body stream can only be consumed once); child
// components render from this already-derived, reusable data.
const responseContent = ref<unknown>(null)
const responseBodyType = ref<'json' | 'image' | 'text' | 'binary' | ''>('')
const responseBlob = ref<Blob | undefined>()
// Resolved schema — needed for toggle visibility check and masked computation
const bodySchema = ref<Record<string, any> | undefined>()

// Passed to BinaryResponse to honor a server-suggested filename
const responseContentDisposition = computed((): string | null => props.response?.headers?.get('content-disposition') ?? null)

// The Result view has renderable content for non-empty text/binary, and always for json/image
const hasBodyResult = computed((): boolean => {
  switch (responseBodyType.value) {
    case 'json':
    case 'image':
      return true
    // a response with no (or an unrecognized) content-type also lands here; without a size
    // check it would show a misleading "download" card for what's really an empty body
    case 'binary':
      return !!responseBlob.value?.size
    case 'text':
      return !!responseContent.value
    default:
      return false
  }
})

const hasHeaders = computed((): boolean => {
  if (!props.response) return false
  return [...props.response.headers.entries()].length > 0
})

const errorText = computed((): string => props.responseError?.message || '')

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

const resultOptions = computed((): SelectItem[] => {
  const opts = []
  if (hasBodyResult.value) {
    opts.push({ value: 'body', label: 'Result' })
  }

  if (hasHeaders.value) {
    opts.push({ value: 'headers', label: 'Headers' })
  }

  if (errorText.value) {
    opts.push({ value: 'error', label: 'Error' })
  }

  return opts
})

const selectedResOption = ref<string>()

watch(resultOptions, (options) => {
  // Only reset when the active option (Result/Headers/Error) is no longer available to preserve selection across visibility toggles
  if (options.length && !options.some(o => o.value === selectedResOption.value)) {
    selectedResOption.value = options[0]?.value
  }
}, { immediate: true })

watch(() => props.response, async (res) => {
  if (res) {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('/json')) {
      responseContent.value = await res.json()
      responseBodyType.value = 'json'
      responseBlob.value = undefined
      bodySchema.value = findResponseSchema(props.responseSchemas, res.status, contentType || 'application/json')
    } else if (contentType.includes('image')) {
      responseBlob.value = await res.blob()
      responseContent.value = null
      responseBodyType.value = 'image'
      bodySchema.value = undefined
    } else if (isTextualContentType(contentType)) {
      responseContent.value = await res.text()
      responseBodyType.value = 'text'
      responseBlob.value = undefined
      bodySchema.value = undefined
    } else {
      // binary response — offer as a download instead of decoding as text
      responseBlob.value = await res.blob()
      responseContent.value = null
      responseBodyType.value = 'binary'
      bodySchema.value = undefined
    }
    // reset to first option (Result/Headers/Error) on each new response
    selectedResOption.value = resultOptions.value[0]?.value
  } else {
    responseContent.value = null
    responseBodyType.value = ''
    responseBlob.value = undefined
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

.res-option-selector {

  :deep(.trigger-button) {
    @include small-bordered-trigger-button;
  }
}

h3 {
  @include collapsible-section-title;
}
</style>
