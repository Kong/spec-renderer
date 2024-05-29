<template>
  <div
    class="request-sample-wrapper"
    :data-testid="`request-sample-${data.id}`"
  >
    <h5>REQUEST SAMPLE</h5>
    <div class="tryit-card">
      <div class="tryit-card-header">
        <select v-model="selectedLang">
          <option
            v-for="lang in requestSampleConfigs"
            :key="lang.httpSnippetLanguage"
            :value="lang.httpSnippetLanguage"
          >
            {{ lang.label }}
          </option>
        </select>
        &nbsp;
        <select
          v-if="selectedLangLibraries.length > 0"
          v-model="selectedLangLibrary"
        >
          <option
            v-for="lib in selectedLangLibraries"
            :key="lib.httpSnippetLibrary"
            :value="lib.httpSnippetLibrary"
          >
            {{ lib.label }}
          </option>
        </select>

        <select
          v-if="requestSamples && requestSamples.length > 0"
          v-model="selectedRequestSample"
          class="request-sample-selector"
        >
          <option
            v-for="sample in requestSamples "
            :key="sample.key"
            :value="sample.key"
          >
            {{ sample.key }}
          </option>
        </select>
      </div>
      <div class="tryit-card-body">
        <div v-if="requestCode">
          <pre>{{ requestCode }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, computed } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation, INodeExample, INodeExternalExample } from '@stoplight/types'
import { HTTPSnippet } from 'httpsnippet-lite'
import { requestSampleConfigs } from '../../../constants'

import type { HarRequest, HTTPSnippet as HTTPSnippetType, TargetId } from 'httpsnippet-lite'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const selectedLang = ref<string>('json')

const selectedLangLibrary = ref<string>()

const selectedLangLibraries = computed(() => {
  if (selectedLang.value) {
    return requestSampleConfigs.find(lang => lang.httpSnippetLanguage === selectedLang.value)?.libraries || []
  } else {
    return []
  }
})

const getFirstSampleKey = (examples: INodeExample[]): string|null => {
  if (Array.isArray(examples) && examples.length > 0) {
    return examples[0].key
  } else {
    return null
  }
}

const getFirstSampleBody = (examples: INodeExample[]): Record<string, any>|null => {
  if (Array.isArray(examples) && examples.length > 0) {
    return examples[0].value
  } else {
    return null
  }
}

const selectedRequestSample = ref<string | null>(props.data?.request?.body?.contents && props.data.request.body.contents.length > 0 ? getFirstSampleKey(props.data.request.body.contents[0].examples as INodeExample[]) : null)

const requestSamples = computed((): INodeExample[] => {
  if (props.data?.request?.body?.contents && props.data.request.body.contents.length > 0 && Array.isArray(props.data.request.body.contents[0].examples) && props.data.request.body.contents[0].examples.length > 0) {
    return props.data.request.body.contents[0].examples as INodeExample[]
  } else {
    return []
  }
})

watch(() => (requestSamples.value), (newValue: INodeExample[]) => {
  selectedRequestSample.value = getFirstSampleKey(newValue)
})

const snippet = ref<HTTPSnippetType>()

const requestCode = ref<string | string[] | null>(JSON.stringify(props.data?.request?.body?.contents && props.data.request.body.contents.length > 0 ? getFirstSampleBody(props.data.request.body.contents[0].examples as INodeExample[]) : null, null, 2))

watch(() => (selectedLang.value), (newLang, oldLang) => {
  if (newLang !== oldLang) {
    selectedLangLibrary.value = selectedLangLibraries.value?.length > 0 ? selectedLangLibraries.value[0].httpSnippetLibrary : undefined
  }
})

watch(() => ({ lang: selectedLang.value, lib: selectedLangLibrary.value }), async ({ lang, lib }) => {
  if (snippet.value) {
    if (lang === 'json') {
      requestCode.value = JSON.stringify((requestSamples.value as INodeExample[]).find(s => s.key === selectedRequestSample.value)?.value)
    } else {
      requestCode.value = await snippet.value.convert(lang as TargetId, lib)
    }
  }
}, { immediate: true })

watch(() => ({
  method: props.data.method,
  requestBodyKey: selectedRequestSample.value,
}), (newValue) => {
  const jsonObj = (requestSamples.value as INodeExample[]).find(s => s.key === newValue.requestBodyKey)?.value
  console.log('aaaa', jsonObj)
  snippet.value = new HTTPSnippet({
    method: newValue.method,
    url: 'http://www.example.com/path/?param=value',
    postData: {
      mimeType: 'application/json',
      jsonObj,
    },
  } as unknown as HarRequest)

}, { immediate: true, deep: true })
</script>

<style lang="scss" scoped>
pre {
  margin: 0;
  white-space: pre-wrap;
}

.request-sample-selector {
  margin-left: auto;
}
</style>
