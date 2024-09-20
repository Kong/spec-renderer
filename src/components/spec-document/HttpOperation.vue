<template>
  <div
    class="http-operation"
    :data-testid="`http-operation-${operationData.id}`"
  >
    <PageHeader
      v-if="operationData.name"
      class="http-operation-header"
      :deprecated="operationData.deprecated"
      :description="operationData.description"
      :title="operationData.name"
      :type="isWebhookOperation ? 'WEBHOOK' : ''"
    >
      <ServerEndpoint
        v-if="serverUrlList.length && operationData.path"
        class="http-operation-server-endpoint"
        :data-testid="`server-endpoint-${operationData.id}`"
        :method="operationData.method"
        :path="operationData.path"
        :selected-server-url="selectedServerUrl"
        :server-url-list="serverUrlList"
        @selected-server-changed="updateSelectedServerURL"
      />
    </PageHeader>


    <section class="http-operation-container">
      <div
        class="left"
        :data-testid="`http-operation-left-${operationData.id}`"
      >
        <HttpRequest
          v-if="operationData.request"
          v-bind="operationData.request"
        />

        <HttpResponse
          class="http-operation-response"
          :content-list="activeResponseContentList"
          :description="activeResponseDescription"
        >
          <ResponseTypeSelect
            :component-list="responseSelectComponentList"
            @update-content-type="(newContentType) => activeContentType = newContentType"
            @update-response-code="(newResponseCode) => activeResponseCode = newResponseCode"
          />
        </HttpResponse>

        <HttpCallbacks
          v-if="callbackList.length"
          :callback="activeCallback"
          class="http-operation-callbacks"
        >
          <SelectDropdown
            :id="`http-callback-select-dropdown-${operationData.id}`"
            v-model="activeCallbackKey"
            class="http-callback-select-dropdown"
            :items="callbackKeyList"
          />

          <template #callback-response>
            <HttpResponse
              :content-list="activeCallbackResponseContentList"
              :description="activeCallbackResponseDescription"
              title="Callback Response"
            >
              <ResponseTypeSelect
                :component-list="activeCallbackResponseSelectComponentList"
                @update-content-type="(newContentType) => activeCallbackContentType = newContentType"
                @update-response-code="(newResponseCode) => activeCallbackResponseCode = newResponseCode"
              />
            </HttpResponse>
          </template>
        </HttpCallbacks>
      </div>
      <div
        class="right"
        :data-testid="`http-operation-right-${operationData.id}`"
      >
        <TryIt
          v-model="excludeNotRequiredInTryIt"
          :data="operationData"
          :request-body="currentRequestBody"
          :server-url="selectedServerUrl"
          @request-body-changed="setRequestBody"
          @request-headers-changed="setRequestHeaders"
          @request-path-changed="setRequestPath"
          @request-query-changed="setRequestQuery"
        />
        <RequestSample
          v-if="selectedServerUrl && currentRequestPath"
          v-model="excludeNotRequiredInSample"
          :auth-headers="authHeaders"
          :auth-query="authQuery"
          :custom-headers="currentRequestHeaders"
          :data="operationData"
          :request-body="currentRequestBody"
          :request-path="currentRequestPath"
          :request-query="currentRequestQuery"
          :server-url="selectedServerUrl"
          @request-body-sample-idx-changed="setRequestBodyByIdx"
        />
        <ResponseSample
          v-if="activeResponseContentList?.length"
          :content-list="activeResponseContentList"
          :content-type="activeContentType"
          :response-code="activeResponseCode"
        >
          <ResponseTypeSelect
            :component-list="responseSelectComponentList"
            @update-content-type="(newContentType) => activeContentType = newContentType"
            @update-response-code="(newResponseCode) => activeResponseCode = newResponseCode"
          />
        </ResponseSample>
        <CallbackSample
          v-if="activeCallback && activeCallbackRequestSample"
          :callback-key="activeCallback.key"
          class="http-operation-callback-sample"
          :request-sample="activeCallbackRequestSample"
        >
          <template #header>
            <SelectDropdown
              :id="`http-callback-sample-select-dropdown-${operationData.id}`"
              v-model="activeCallbackKey"
              class="http-callback-select-dropdown"
              :items="callbackKeyList"
            /> callback sample
          </template>
          <ResponseSample
            v-if="activeCallbackResponseContentList?.length"
            :content-list="activeCallbackResponseContentList"
            :content-type="activeCallbackContentType"
            :response-code="activeCallbackResponseCode"
          >
            <div class="calback-response-sample-header">
              <span>Callback Response</span>
              <ResponseTypeSelect
                :component-list="activeCallbackResponseSelectComponentList"
                @update-content-type="(newContentType) => activeCallbackContentType = newContentType"
                @update-response-code="(newResponseCode) => activeCallbackResponseCode = newResponseCode"
              />
            </div>
          </ResponseSample>
        </CallbackSample>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, provide } from 'vue'
import type { ComputedRef, PropType, Ref } from 'vue'
import type { IHttpOperation, IHttpWebhookOperation } from '@stoplight/types'
import HttpRequest from './endpoint/HttpRequest.vue'
import HttpResponse from './endpoint/HttpResponse.vue'
import HttpCallbacks from './endpoint/HttpCallbacks.vue'
import TryIt from './try-it/TryIt.vue'
import RequestSample from './samples/RequestSample.vue'
import ResponseSample from './samples/ResponseSample.vue'
import CallbackSample from './samples/CallbackSample.vue'
import ServerEndpoint from './endpoint/ServerEndpoint.vue'
import ResponseTypeSelect from './endpoint/ResponseTypeSelect.vue'
import PageHeader from '../common/PageHeader.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import { getSamplePath, getSampleQuery, getSampleBody } from '@/utils'
import composables from '@/composables'
import type { SecuritySchemeGroup } from '@/types'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation | IHttpWebhookOperation>,
    required: true,
  },
})

const securitySchemeGroupList = computed<Array<SecuritySchemeGroup>>(() => {
  const schemeGroupList = []
  for (const secGroup of (props.data.security ?? [])) {
    if (secGroup.length) {
      let title = ''
      let key = ''
      secGroup.forEach((scheme) => {
        title = title.length ? title + ` & ${scheme.key}` : scheme.key,
        key = key.length ? key + `-${scheme.key.replace(' ', '-')}` : scheme.key.replace(' ', '-')
      })
      schemeGroupList.push({
        title,
        key,
        schemeList: secGroup,
      })
    }
  }

  return schemeGroupList
})

const activeSchemeGroupKey = ref<string>(securitySchemeGroupList.value[0]?.key ?? '')

provide<ComputedRef<Array<SecuritySchemeGroup>>>('security-scheme-group-list', securitySchemeGroupList)
provide<Ref<string>>('active-scheme-group-key', activeSchemeGroupKey)

const hideTryIt = inject<Ref<boolean>>('hide-tryit', ref(false))

const excludeNotRequiredInTryIt = ref<boolean>(true)
const excludeNotRequiredInSample = ref<boolean>(true)

const operationData = computed(() => ({
  ...props.data,
  name: 'name' in props.data ? props.data.name : props.data.summary || props.data.iid || props.data.path,
  path: 'path' in props.data ? props.data.path : '',
}))

const isWebhookOperation = computed(() => 'name' in props.data)

const excludeNotRequired = computed((): boolean => {
  return hideTryIt.value ? excludeNotRequiredInSample.value : excludeNotRequiredInTryIt.value
})

const {
  serverUrlList,
  selectedServerUrl,
} = composables.useServerList()

const currentRequestPath = ref<string>('')
const currentRequestQuery = ref<string>('')
const currentRequestHeaders = ref<Array<Record<string, string>>>([])
const currentRequestBody = ref<string>('')

const { authHeaderMap, authQueryMap } = composables.useAuthTokenState()

const authHeaders = computed(() => authHeaderMap.value[activeSchemeGroupKey.value] ?? [])
const authQuery = computed(() => authQueryMap.value[activeSchemeGroupKey.value] ?? '')

// refs and computed properties to manage currently active response object
const responseList = computed(() => props.data.responses ?? [])
const {
  activeResponseDescription,
  activeResponseCode,
  activeContentType,
  activeResponseContentList,
  responseSelectComponentList,
} = composables.useCurrentResponse(responseList)

const callbackList = computed(() => props.data.callbacks ?? [])
const {
  activeCallbackKey,
  callbackKeyList,
  activeCallback,
  activeCallbackRequestSample,
  activeCallbackResponseDescription,
  activeCallbackResponseCode,
  activeCallbackContentType,
  activeCallbackResponseContentList,
  activeCallbackResponseSelectComponentList,
} = composables.useCurrentCallback(callbackList)

const setRequestPath = (newPath: string) => {
  currentRequestPath.value = newPath
}

const setRequestQuery = (newQuery: string) => {
  currentRequestQuery.value = newQuery
}

const setRequestHeaders = (newHeaders: Array<Record<string, string>>) => {
  currentRequestHeaders.value = newHeaders
}

const setRequestBody = (newBody: string) => {
  currentRequestBody.value = newBody
}

const setRequestBodyByIdx = (newSampleIdx: number) => {
  currentRequestBody.value = props.data.request?.body?.contents
    ? getSampleBody(
      props.data.request?.body?.contents,
      { excludeReadonly: true, excludeNotRequired: excludeNotRequired.value },
      newSampleIdx,
    )
    : ''
}

function updateSelectedServerURL(url: string) {
  selectedServerUrl.value = url
}

watch(() => ({ id: props.data.id, excludeNotRequired: excludeNotRequired.value } ), (newValue) => {
  currentRequestPath.value = getSamplePath(operationData.value)
  currentRequestQuery.value = getSampleQuery(operationData.value)
  currentRequestHeaders.value = []
  currentRequestBody.value = props.data.request?.body?.contents
    ? getSampleBody(
      props.data.request?.body?.contents,
      { excludeReadonly: true, excludeNotRequired: newValue.excludeNotRequired },
      0,
    )
    : ''
}, { immediate: true })
</script>

<style lang="scss" scoped>
@mixin http-operation-container-small {
  grid-template-columns: 1fr;

  .right {
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}

.http-operation {
  * {
    margin: var(--kui-space-0, $kui-space-0);
  }

  .http-operation-header {
    margin-bottom: var(--kui-space-90, $kui-space-90);
  }

  .http-operation-container  {
    display: grid;
    gap: var(--kui-space-10, $kui-space-10);
    grid-template-columns: auto clamp($spec-renderer-secondary-column-min-width, 40%, $spec-renderer-secondary-column-max-width);
    width: 100%;

    .left {
      color: var(--kui-color-text, $kui-color-text);
      padding-right: var(--kui-space-50, $kui-space-50);
    }

    .right {
      background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
      padding: var(--kui-space-0, $kui-space-0);

      > :not(:first-child) {
        margin-top: var(--kui-space-70, $kui-space-70);
      }
    }

    .http-operation-callbacks, .http-operation-callback-sample {
      .http-callback-select-dropdown {
        :deep(.trigger-button) {
          @include small-bordered-trigger-button;
        }
      }
    }

    .http-operation-callback-sample {
      .calback-response-sample-header {
        align-items: center;
        display: flex;
        gap: var(--kui-space-50, $kui-space-50);
      }
    }

    @supports (container: inline-size) {
      // need to use interpolation for the token here because otherwise the query don't work
      @container spec-document (max-width: #{$kui-breakpoint-tablet - 1px}) {
        @include http-operation-container-small;
      }
    }

    // regular media query fallback
    @supports not (container: inline-size) {
      @media (max-width: ($kui-breakpoint-laptop - 1px)) {
        @include http-operation-container-small;
      }
    }
  }
}
</style>
