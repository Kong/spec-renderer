<template>
  <CollapsablePanel :data-testid="`tryit-response-${dataId}`">
    <template #header>
      <h5>
        <span v-if="!response?.status">
          Response
        </span>

        <span
          v-if="response?.status"
          :class="`response-status ${response?.ok}`"
        >
          {{ response?.status }}
        </span>
      </h5>
      <select
        v-if="selectedResOption?.length"
        v-model="selectedResOption"
        class="res-option-selector"
      >
        <option
          v-for="resOpt in resultOptions"
          :key="resOpt.value"
          :value="resOpt.value"
        >
          {{ resOpt.label }}
        </option>
      </select>
    </template>

    <div class="wide">
      <CodeBlock
        v-show="responseText && selectedResOption === 'body'"
        class="response-body"
        :code="responseText"
        lang="json"
      />
    </div>

    <div class="wide">
      <div
        v-show="errorText && selectedResOption === 'error'"
        class="error-panel"
      >
        {{ errorText }}
        <div v-if="!response">
          Make sure CORS is enabled for the server
        </div>
      </div>
    </div>

    <div class="wide">
      <CodeBlock
        v-show="headersText && selectedResOption === 'headers'"
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

const props = defineProps({
  dataId: {
    type: String,
    required: true,
  },
  response: {
    type: Object as PropType<Response>,
    default: () =>{ },
  },
  responseError: {
    type: Object as PropType<Error>,
    default: () => { },
  },
})

const errorText = computed(():string => {
  return props.responseError?.message
})

const headersText = computed((): string => {

  const headers = <Record<string, any>>{}
  if (props.response) {
    for (const pair of props.response.headers.entries()) {
      headers[pair[0]] = pair[1]
    }
  }
  return Object.keys(headers).length ? JSON.stringify(headers, null, 2): ''
})

const responseText = ref<string>('')

const resultOptions = computed(():Array<Record<string, string>> => {
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

const selectedResOption = ref<string>()

watch(resultOptions, () => {
  if (resultOptions.value.length) {
    selectedResOption.value = resultOptions.value[0].value
  }
}, { immediate: true })

const requestLang = ref<string>('')

watch(() => props.response, async (res) => {
  if (res) {
    if (res.headers.get('content-type')?.includes('/json')) {
      responseText.value = JSON.stringify(await res.json(), null, 2)
      requestLang.value = 'json'
    } else {
      responseText.value = await res.text()
      requestLang.value = ''
    }
  } else {
    responseText.value = ''
    requestLang.value = ''
  }
}, { immediate: true })

</script>

<style lang="scss" scoped>
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
  background-color: var( --kui-color-background-danger-weaker, $kui-color-background-danger-weaker);
  border: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  color: var(--kui-color-text-danger-strong, $kui-color-text-danger-strong);
  padding: var(--kui-space-40, $kui-space-40);
}
.res-option-selector {
  margin-left: auto!important;
  width: 100px;
}
:deep(.response-body pre) {
    max-height: 200px;
    overflow-y: auto;
}

</style>