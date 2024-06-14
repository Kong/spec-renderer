<template>
  <div
    class="request-sample-wrapper"
    :data-testid="`request-sample-${data.id}`"
  >
    <h5>REQUEST SAMPLE</h5>
    <CollapsablePanel>
      <template #header>
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
      </template>
      <!-- body -->
      <div class="wide">
        <CodeBlock
          v-if="requestCode && selectedLang"
          :code="requestCode as string"
          :lang="selectedLang"
        />
      </div>
    </CollapsablePanel>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, computed } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation, INodeExample } from '@stoplight/types'
import { HTTPSnippet } from 'httpsnippet-lite'
import { requestSampleConfigs } from '@/constants'
import { getRequestHeaders } from '@/utils'
import CodeBlock from '@/components/common/CodeBlock.vue'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import type { LanguageCode } from '@/types/request-languages'
import type { HarRequest, HTTPSnippet as HTTPSnippetType, TargetId } from 'httpsnippet-lite'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  /**
   * server url+path selected by user on endpoints detail page
   */
  serverUrl: {
    type: String,
    required: true,
  },
  requestPath: {
    type: String,
    required: true,
  },
  authHeaders: {
    type: Array as PropType<Record<string, string>[]>,
    default: () => [],
  },
  requestQuery: {
    type: String,
    default: '',
  },

})

const requestConfigs = computed(() => {
  if (['get', 'delete'].includes(props.data.method) || requestSamples.value.length === 0) {
    return requestSampleConfigs.filter(c => c.httpSnippetLanguage !== 'json')
  } else {
    return requestSampleConfigs
  }
})

const selectedLang = ref<LanguageCode>()

const selectedLangLibrary = ref<string>()

const selectedLangLibraries = computed(() => {
  if (selectedLang.value) {
    return requestSampleConfigs.find(lang => lang.httpSnippetLanguage === selectedLang.value)?.libraries || []
  } else {
    return []
  }
})

const getFirstSampleKey = (examples: INodeExample[]): string | null => {
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

const snippet = ref<HTTPSnippetType>()

const requestCode = ref<string | string[] | null>()


watch(() => ({
  method: props.data.method,
  requestBodyKey: selectedRequestSample.value,
  lang: selectedLang.value,
  lib: selectedLangLibrary.value,
  serverUrl: props.serverUrl,
  authHeaders: props.authHeaders,
  requestPath: props.requestPath,
  requestQuery: props.requestQuery,
}), async (newValue, oldValue) => {
  const jsonObj = (requestSamples.value as INodeExample[]).find(s => s.key === newValue.requestBodyKey)?.value

  if (newValue.method !== oldValue?.method) {
    selectedLang.value = requestConfigs.value[0].httpSnippetLanguage
    newValue.lang = selectedLang.value
  }

  if (newValue.lang !== oldValue?.lang) {
    selectedLangLibrary.value = selectedLangLibraries.value?.length ? selectedLangLibraries.value[0].httpSnippetLibrary : undefined
  }
  let snippetError = false
  let snippetChanged = false

  // if we selected new requestBody or if we do not have httpSNippet yet, we need to re-init it
  if (!snippet.value ||
    newValue.requestBodyKey !== oldValue?.requestBodyKey ||
    newValue.serverUrl !== oldValue.serverUrl ||
    newValue.requestPath !== oldValue.requestPath ||
    newValue.requestQuery !== oldValue.requestQuery ||
    newValue.authHeaders !== oldValue?.authHeaders) {

    // TODO: handle body change gracefully

    try {

      let serverUrl = new URL((newValue.serverUrl + newValue.requestPath).replaceAll('{', '').replaceAll('}', ''))
      serverUrl.search = newValue.requestQuery
      const reqData: HarRequest = ({
        method: newValue.method,
        url: serverUrl.toString(),
        headers: [
          ...newValue.authHeaders,
          ...getRequestHeaders(props.data),
        ],
        postData: {
          mimeType: 'application/json',
          text: JSON.stringify(jsonObj, null, 2),
        },
      } as unknown as HarRequest)

      snippet.value = new HTTPSnippet(reqData)

      snippetChanged = true
    } catch {
      snippetError = true
    }
  }
  if (snippetError) {
    requestCode.value = 'Error initializing code snippet'
  } else {
    // if we do not have requestCode generated, or our lanf or lib are changed - we need to re-generate requestCode
    if (!requestCode.value || snippetChanged || newValue.lang !== oldValue?.lang || newValue.lib !== oldValue?.lib) {
      if (newValue.lang === 'json') {
        requestCode.value = jsonObj ? JSON.stringify(jsonObj, null, 2) : null
      } else if (snippet.value) {
        requestCode.value = await snippet.value.convert((newValue.lang as TargetId), newValue.lib)
      }
    }
  }
}, { immediate: true, deep: true })

</script>

<style lang="scss" scoped>

.request-sample-wrapper {
  h5 {
    margin: var(--kui-space-60, $kui-space-60) var(--kui-space-30, $kui-space-30) var(--kui-space-30, $kui-space-30);
  }
  .request-sample-selector {
    margin-left: auto;
  }
}
</style>
