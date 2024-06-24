<template>
  <div
    v-if="showTryIt"
    class="tryit-wrapper"
    :data-testid="`tryit-wrapper-${data.id}`"
  >
    <div class="tryit-header">
      <MethodBadge
        :method="data.method"
        size="small"
      />
      <span class="path">{{ data.path }}</span>

      <TryItButton
        class="tryit-btn"
        :data="data"
        @tryit-api-call="doApiCall"
      />
    </div>

    <TryItAuth
      v-if="showTryIt"
      :data="data"
      @access-tokens-changed="accessTokenChanged"
    />

    <TryItServer
      :data="data"
      :server-url="serverUrl"
      @server-url-changed="serverUrlChanged"
    />

    <TryItParams
      :data="data"
      param-type="path"
      @request-path-changed="requestPathChanged"
    />

    <TryItParams
      :data="data"
      param-type="query"
      @request-query-changed="requestQueryChanged"
    />
    <TryItParams
      :data="data"
      param-type="body"
      :request-body="currentRequestBody"
      @request-body-changed="requestBodyChanged"
    />
    <TryItResponse
      v-if="response || responseError"
      :data-id="data.id"
      :response="response"
      :response-error="responseError"
    />
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref, watch } from 'vue'
import type { PropType, Ref } from 'vue'
import TryItButton from './TryItButton.vue'
import { getRequestHeaders } from '@/utils'
import type { IHttpOperation } from '@stoplight/types'
import MethodBadge from '@/components/common/MethodBadge.vue'
import TryItAuth from './TryItAuth.vue'
import TryItServer from './TryItServer.vue'
import TryItParams from './TryItParams.vue'
import TryItResponse from './TryItResponse.vue'
import { getSamplePath, getSampleQuery } from '@/utils'


const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  serverUrl: {
    type: String,
    required: true,
  },
  requestBody: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'access-tokens-changed', authHeaders: Array<Record<string, string>>): void
  (e: 'server-url-changed', serverUrl: string): void
  (e: 'request-path-changed', newPath: string): void
  (e: 'request-query-changed', newPath: string): void
  (e: 'request-body-changed', newBody: string): void
}>()


const response = ref<Response | undefined>()
const responseError = ref<Error>()

const authHeaders = ref<Array<Record<string, string>>>()

const currentServerUrl = ref<string>(props.serverUrl)

const currentRequestPath = ref<string>('')

const currentRequestQuery = ref<string>('')

const currentRequestBody = ref<string>('')

const requestPathChanged = (newPath: string) => {
  currentRequestPath.value = newPath
  emit('request-path-changed', newPath)
}

const requestQueryChanged = (newQuery: string) => {
  currentRequestQuery.value = newQuery
  emit('request-query-changed', newQuery)
}

const requestBodyChanged = (newBody: string) => {
  currentRequestBody.value = newBody
  emit('request-body-changed', newBody)
}

/*
this is the result of emitting an event inside of TryItServer, when user changes server variables
as a result of this we need to set new value for currentServerUrl in this component to use in actual fetch
and promote it one level up so RequestSample component has correct Url.
*/
const serverUrlChanged = (newServerUrl: string) => {
  currentServerUrl.value = newServerUrl
  emit('server-url-changed', newServerUrl)
}

// this is tryout state requested by property passed
const hideTryIt = inject<Ref<boolean>>('hide-tryit', ref(false))

const doApiCall = async () => {
  try {
    response.value = undefined
    const url = new URL(`${currentServerUrl.value}${currentRequestPath.value}`.replaceAll('{', '').replaceAll('}', ''))
    url.search = currentRequestQuery.value
    response.value = await fetch(url, {
      method: props.data.method,
      headers: [
        ...(authHeaders?.value || []),
        ...getRequestHeaders(props.data),
      ].reduce((acc, current) => {
        acc[current.name] = current.value; return acc
      }
      , { }),
      ...(currentRequestBody.value ? { body: currentRequestBody.value } : null),
    })
  } catch (error: any) {
    responseError.value = error
  }
}

/* pass trough one level up as it needs to change Request sample */
const accessTokenChanged = (newHeaders: Array<Record<string, string>>) => {
  emit('access-tokens-changed', newHeaders)
  authHeaders.value = newHeaders
}

// there is more logic that drives do we show tryouts or not
const showTryIt = computed((): boolean => {
  // if there are no services defined in overView we do not show tryIt
  return !hideTryIt.value && Array.isArray(props.data.servers) && !!props.data.servers.length
})

watch(() => props.serverUrl, () => {
  currentServerUrl.value = props.serverUrl
})

watch(() => props.requestBody, (body) => {
  currentRequestBody.value = body
}, { immediate: true })

watch(() => (props.data.id), () => {
  currentRequestPath.value = getSamplePath(props.data)
  currentRequestQuery.value = getSampleQuery(props.data)
  response.value = undefined
}, { immediate: true })

</script>

<style lang="scss" scoped>

.tryit-header {
  align-items: center;
  display: flex;
  padding: var(--kui-space-40, $kui-space-40) var(--kui-space-0, $kui-space-0);
  .path {
    margin-left: var(--kui-space-20, $kui-space-20);
  }
  .tryit-btn {
    margin-left: auto;
  }
}

/* using deep as this thing is used in multiple child components */
:deep(.panel-body input), :deep(.panel-body select) {
  border: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  box-sizing: border-box;
  padding: var(--kui-space-40, $kui-space-40) var(--kui-space-50, $kui-space-50);
  width: 100%;
}
// required label
:deep(label>span) {
  color: var(--kui-color-text-danger, $kui-color-text-danger);
}

:deep(label) {
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
}
</style>
