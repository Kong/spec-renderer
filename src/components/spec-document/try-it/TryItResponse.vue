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
      v-if="responseText && selectedResOption === 'body'"
      class="wide"
    >
      <component
        :is="responseBodyComponent.component"
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
        lang="json"
      />
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import CodeBlock from '@/components/common/CodeBlock.vue'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import type { PropType } from 'vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import type { SelectItem } from '@/types'
import { CODE_INDENT_SPACES } from '@/constants'

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
})

const errorText = computed((): string => {
  return props.responseError?.message || ''
})

const headersText = computed((): string => {

  const headers = <Record<string, any>>{}
  if (props.response) {
    for (const pair of props.response.headers.entries()) {
      headers[pair[0]] = pair[1]
    }
  }
  return Object.keys(headers).length ? JSON.stringify(headers, null, CODE_INDENT_SPACES) : ''
})

const responseText = ref<string>('')

const resultOptions = computed((): SelectItem[] => {
  const opts = []
  if (responseText.value) {
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

const isResponseImage = computed(() => props.response.headers.get('content-type')?.includes('image') ?? false)

// Returns the component & props to be used to display the response body
const responseBodyComponent = computed(() => {
  if (isResponseImage.value) {
    return {
      component: 'img',
      props: {
        src: responseText.value,
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
    },
  }
})

const selectedResOption = ref<string>()

watch(resultOptions, (options) => {
  if (options.length) {
    selectedResOption.value = options[0].value
  }
}, { immediate: true })

const requestLang = ref<string>('')

watch(() => props.response, async (res) => {
  if (res) {
    if (res.headers.get('content-type')?.includes('/json')) {
      responseText.value = JSON.stringify(await res.json(), null, CODE_INDENT_SPACES)
      requestLang.value = 'json'
    } else if (isResponseImage.value) {
      const blob = await res.blob()
      responseText.value = URL.createObjectURL(blob)
    } else {
      responseText.value = await res.text()
      requestLang.value = 'text'
    }
  } else {
    responseText.value = ''
    requestLang.value = ''
  }
}, { immediate: true })

</script>

<style lang="scss" scoped>
.h-wrapper {
  display: flex;
  flex: 1;
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
  background-color: var( --kui-color-background-danger-weakest, $kui-color-background-danger-weakest);
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
  max-height: 200px;
  overflow-y: auto;
}

h3 {
  @include collapsible-section-title;
}
</style>
