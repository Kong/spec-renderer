<template>
  <div
    class="request-sample-wrapper"
    :data-testid="`request-sample-${data.id}`"
  >
    <h5>REQUEST SAMPLE</h5>
    <div class="right-card">
      <div class="right-card-header">
        <select v-model="selectedLang">
          <option
            v-for="lang in requestConfigs"
            :key="lang.httpSnippetLanguage"
            :value="lang.httpSnippetLanguage"
          >
            {{ lang.label }}
          </option>
        </select>
        &nbsp;
        <select
          v-if="selectedLangLibraries.length"
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
          v-if="requestSamples && requestSamples.length"
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
      <div class="right-card-body">
        <!-- eslint-disable vue/no-v-html -->
        <div
          v-if="requestCode"
          v-html="requestCode"
        />
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, computed } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation, INodeExample } from '@stoplight/types'
import { HTTPSnippet } from 'httpsnippet-lite'
import { requestSampleConfigs } from '../../../constants'
import composables from '@/composables'
import type { HarRequest, HTTPSnippet as HTTPSnippetType, TargetId } from 'httpsnippet-lite'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  /**
   * server url+path selected by user on endpoints detail page
   */
  baseServerUrl: {
    type: String,
    required: true,
  },
  authHeaders: {
    type: Array<Record<string, string>>,
    default: [],
  },
})

const { getHighlighter } = composables.useShiki()

const requestConfigs = computed(() => {
  if (['get', 'delete'].includes(props.data.method) || requestSamples.value.length === 0) {
    return requestSampleConfigs.filter(c => c.httpSnippetLanguage !== 'json')
  } else {
    return requestSampleConfigs
  }
})

const selectedLang = ref<string>()

const selectedLangLibrary = ref<string>()

const selectedLangLibraries = computed(() => {
  if (selectedLang.value) {
    return requestSampleConfigs.find(lang => lang.httpSnippetLanguage === selectedLang.value)?.libraries || []
  } else {
    return []
  }
})

const getFirstSampleKey = (examples: INodeExample[]): string|null => {
  if (Array.isArray(examples) && examples.length) {
    return examples[0].key
  } else {
    return null
  }
}

const selectedRequestSample = ref<string | null>(props.data?.request?.body?.contents && props.data.request.body.contents.length ? getFirstSampleKey(props.data.request.body.contents[0].examples as INodeExample[]) : null)

const requestSamples = computed((): INodeExample[] => {
  if (props.data?.request?.body?.contents && props.data.request.body.contents.length && Array.isArray(props.data.request.body.contents[0].examples) && props.data.request.body.contents[0].examples.length) {
    return props.data.request.body.contents[0].examples as INodeExample[]
  } else {
    return []
  }
})

watch(requestSamples, (newValue: INodeExample[]) => {
  selectedRequestSample.value = getFirstSampleKey(newValue)
})

const acceptHeader = computed(():string => {
  const headers = new Set()
  props.data.responses?.forEach(response => {
    (response.contents || []).forEach(content => {
      headers.add(content.mediaType)
    })
  })
  return [...headers].join(', ')
})

const snippet = ref<HTTPSnippetType>()

const requestCode = ref<string | string[] | null>()

const getHighlightLanguage = (snippetLang: string | null | undefined): string | null | undefined => {
  return requestConfigs.value.find(c => c.httpSnippetLanguage === snippetLang)?.highlightLanguage
}

watch(() => ({
  method: props.data.method,
  requestBodyKey: selectedRequestSample.value,
  lang: selectedLang.value,
  lib: selectedLangLibrary.value,
  serverUrl: props.baseServerUrl,
  authHeaders: props.authHeaders,
}), async (newValue, oldValue) => {
  const jsonObj = (requestSamples.value as INodeExample[]).find(s => s.key === newValue.requestBodyKey)?.value

  if (newValue.method !== oldValue?.method) {
    selectedLang.value = requestConfigs.value[0].httpSnippetLanguage
    newValue.lang = selectedLang.value
  }

  if (newValue.lang !== oldValue?.lang) {
    selectedLangLibrary.value = selectedLangLibraries.value?.length ? selectedLangLibraries.value[0].httpSnippetLibrary : undefined
  }
  let snippedChanged = false

  // if we selected new requestBody or if we do not have httpSNippet yet, we need to re-init it
  if (!snippet.value || newValue.requestBodyKey !== oldValue?.requestBodyKey || newValue.serverUrl !== oldValue.serverUrl || newValue.authHeaders !== oldValue?.authHeaders) {

    // TODO: handle parameter / query change in url gracefully
    const serverUrl = newValue.serverUrl.replace(/[{}]/g, '')
    let serverUrlValid = true
    try {
      // eslint-disable-next-line no-new
      new URL(serverUrl)
    } catch (e) {
      serverUrlValid = false
    }

    if (serverUrlValid) {
      snippet.value = new HTTPSnippet({
        method: newValue.method,
        url: serverUrl,
        headers: [
          ...newValue.authHeaders,
          {
            name: 'Content-Type',
            value: props.data.responses?.[0].contents?.[0].mediaType ?? 'application/json',
          },
          {
            name: 'Accept',
            value: acceptHeader.value,
          },
        ],
        postData: {
          mimeType: 'application/json',
          text: JSON.stringify(jsonObj, null, 2),
        },
      } as unknown as HarRequest)

      snippedChanged = true
    }
  }

  // if our we do not have requestCode generated, or our lanf or lib are changed - we need to re-generate requestCode
  if (!requestCode.value || snippedChanged || newValue.lang !== oldValue?.lang || newValue.lib !== oldValue?.lib) {
    const highlighter = await getHighlighter()
    if (newValue.lang === 'json') {
      requestCode.value = jsonObj ? highlighter.codeToHtml(JSON.stringify(jsonObj, null, 2), { lang: 'json', theme: 'material-theme-palenight' }) : null
    } else if (snippet.value) {
      const code = await snippet.value.convert(newValue.lang as TargetId, newValue.lib)
      const hightLightLang = getHighlightLanguage(newValue.lang)
      if (hightLightLang) {
        requestCode.value = highlighter.codeToHtml(code as string, { lang: hightLightLang, theme: 'material-theme-palenight' })
      } else {
        requestCode.value = code
      }
    }
  }
}, { immediate: true, deep: true })
</script>

<style lang="scss" scoped>
:deep(pre) {
  margin: 0;
  white-space: pre-wrap;

  code {
    background: transparent!important;
  }
}

.request-sample-selector {
  margin-left: auto;
}
</style>
