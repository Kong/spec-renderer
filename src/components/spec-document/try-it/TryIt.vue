<template>
  <div
    v-if="showTryIt"
    class="tryit-wrapper"
    :data-testid="`tryit-wrapper-${data.id}`"
  >
    <div
      class="tryit-header"
      :class="{ 'no-body': sectionBodyEmpty }"
    >
      <div class="method-path">
        <MethodBadge
          :method="data.method"
          size="small"
        />
        <span class="path">{{ data.path }}</span>
      </div>

      <TryItDropdown
        v-if="data.path"
        class="tryit-button-dropdown"
        :data="data"
        :is-loading="apiCallLoading"
        @tryit-api-call="doApiCall"
      />
    </div>

    <div
      v-if="!sectionBodyEmpty"
      class="tryit-body"
    >
      <TryItAuth
        :data="data"
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
        :exclude-header-list="authHeaderNameList"
        param-type="headers"
        @request-headers-changed="requestHeadersChanged"
      />

      <TryItParams
        v-model="excludeNotRequired"
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
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref, watch } from 'vue'
import type { PropType, Ref } from 'vue'
import TryItDropdown from './TryItDropdown.vue'
import { getRequestHeaders } from '@/utils'
import type { IHttpOperation } from '@stoplight/types'
import MethodBadge from '@/components/common/MethodBadge.vue'
import TryItAuth from './TryItAuth.vue'
import TryItParams from './TryItParams.vue'
import TryItResponse from './TryItResponse.vue'
import { getSamplePath, getSampleQuery } from '@/utils'
import composables from '@/composables'

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

const excludeNotRequired = defineModel({
  type: Boolean,
  default: true,
})

const emit = defineEmits<{
  (e: 'request-path-changed', newPath: string): void
  (e: 'request-query-changed', newPath: string): void
  (e: 'request-headers-changed', newHeaders: Array<Record<string, string>>): void
  (e: 'request-body-changed', newBody: string): void
}>()

const { activeSecurityScheme, authHeaderMap, authQueryMap } = composables.useAuthTokenState()

const authHeaders = computed(() => authHeaderMap.value[activeSecurityScheme.value] ?? [])
const authQuery = computed(() => authQueryMap.value[activeSecurityScheme.value] ?? '')

const response = ref<Response | undefined>()
const responseError = ref<Error>()

const currentServerUrl = ref<string>(props.serverUrl)

const currentRequestPath = ref<string>('')

const currentRequestQuery = ref<string>('')

const currentRequestHeaders = ref<Array<Record<string, string>>>([])

const currentRequestBody = ref<string>('')

const apiCallLoading = ref(false)

// hide body section if none of the params are present
const sectionBodyEmpty = computed((): boolean =>
  (!props.data.servers || !props.data.servers.some(s => s.variables)) &&
  (!props.data.request?.query || !props.data.request?.query.length) &&
  (!props.data.request?.path || !props.data.request?.path.length) &&
  (!props.data.request?.headers || !props.data.request?.headers.length) &&
  !currentRequestBody.value &&
  !response.value &&
  !responseError.value,
)

const requestPathChanged = (newPath: string) => {
  currentRequestPath.value = newPath
  emit('request-path-changed', newPath)
}

const requestQueryChanged = (newQuery: string) => {
  currentRequestQuery.value = newQuery
  emit('request-query-changed', newQuery)
}

const requestHeadersChanged = (newHeaderList: Array<Record<string, string>>) => {
  currentRequestHeaders.value = newHeaderList
  emit('request-headers-changed', newHeaderList)
}

const requestBodyChanged = (newBody: string) => {
  currentRequestBody.value = newBody
  emit('request-body-changed', newBody)
}

// this is tryout state requested by property passed
const hideTryIt = inject<Ref<boolean>>('hide-tryit', ref(false))

const doApiCall = async () => {
  try {
    apiCallLoading.value = true
    response.value = undefined
    const url = new URL(`${currentServerUrl.value}${currentRequestPath.value}`.replaceAll('{', '').replaceAll('}', ''))
    let queryStr = currentRequestQuery.value
    if (authQuery.value) {
      queryStr += (currentRequestQuery.value ? '&' : '?') + authQuery.value
    }

    url.search = queryStr
    response.value = await fetch(url, {
      method: String(props.data.method).toUpperCase(),
      headers: [
        ...(authHeaders?.value || []),
        ...getRequestHeaders(props.data),
        ...currentRequestHeaders.value,
      ].reduce((acc, current) => {
        acc[current.name] = current.value; return acc
      }
      , { }),
      ...(currentRequestBody.value ? { body: currentRequestBody.value } : null),
    })
  } catch (error: any) {
    responseError.value = error
  } finally {
    apiCallLoading.value = false
  }
}

// there is more logic that drives do we show tryouts or not
const showTryIt = computed((): boolean => {
  // if there are no services defined in overView we do not show tryIt
  return !hideTryIt.value && Array.isArray(props.data.servers) && !!props.data.servers.length
})

const authHeaderNameList = computed(() => authHeaders.value?.map(({ name }) => name) ?? [])

watch(() => props.serverUrl, () => {
  currentServerUrl.value = props.serverUrl
})

watch(() => props.requestBody, (body) => {
  currentRequestBody.value = body
}, { immediate: true })

watch(() => (props.data.id), () => {
  currentRequestPath.value = getSamplePath(props.data)
  currentRequestQuery.value = getSampleQuery(props.data)
  currentRequestHeaders.value = []
  response.value = undefined
  responseError.value = undefined
}, { immediate: true })

</script>

<style lang="scss" scoped>
.tryit-wrapper {
  .tryit-header {
    background-color: var(--kui-color-background, $kui-color-background);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-top-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    border-top-right-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-30, $kui-space-30);
    padding: var(--kui-space-50, $kui-space-50);

    .method-path {
      align-items: center;
      display: flex;
      gap: var(--kui-space-30, $kui-space-30);
    }

    .path {
      font-family: var(--kui-font-family-code, $kui-font-family-code);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
      overflow-wrap: anywhere;
    }

    @media (min-width: $kui-breakpoint-mobile) {
      align-items: center;
      flex-direction: row;

      .tryit-button-dropdown {
        margin-left: var(--kui-space-auto, $kui-space-auto);
      }
    }

    &.no-body {
      border-bottom-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
      border-bottom-right-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    }
  }

  .tryit-body {
    background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-bottom-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    border-bottom-right-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    border-top: 0px;
    padding: var(--kui-space-40, $kui-space-40);
  }
}
</style>
