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
import type { IHttpOperation } from '@stoplight/types'
import { HTTPSnippet } from 'httpsnippet-lite'
import { requestSampleConfigs } from '../../../constants'

import type { HarRequest, HTTPSnippet as HTTPSnippetType } from 'httpsnippet-lite'

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

const snippet = ref<HTTPSnippetType>()

const requestCode = ref<string|string[]|null>(JSON.stringify({}))

watch(() => (selectedLang.value), (newLang, oldLang) => {
  if (newLang !== oldLang) {
    selectedLangLibrary.value = selectedLangLibraries.value?.length > 0 ? selectedLangLibraries.value[0].httpSnippetLibrary : undefined
  }
})

watch(() => ({ lang: selectedLang.value, lib: selectedLangLibrary.value }), async ({ lang, lib }) => {
  if (snippet.value) {
    console.log({ lang, lib })
    if (lang === 'json') {
      requestCode.value = JSON.stringify({})
    } else {
      requestCode.value = await snippet.value.convert(lang, lib)
    }
  }
}, { immediate: true })

watch(() => (props.data), () => {

  snippet.value = new HTTPSnippet({
    method: 'GET',
    url: 'http://www.example.com/path/?param=value',
  } as HarRequest)

}, { immediate: true })
</script>

<style lang="scss" scoped>
pre {
  margin: 0;
  white-space: pre-wrap;
}
</style>
