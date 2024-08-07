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
    >
      <ServerEndpoint
        v-if="serverList.length && operationData.path"
        class="http-operation-server-endpoint"
        :data-testid="`server-endpoint-${operationData.id}`"
        :method="operationData.method"
        :path="operationData.path"
        :selected-server-url="selectedServerURL"
        :server-url-list="serverList"
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
          <div class="http-response-header-menu">
            <SelectDropdown
              v-for="component in responseSelectComponentList"
              :id="`http-response-header-dropdown-${operationData.id}`"
              :key="component.name"
              :items="component.optionList"
              :model-value="component.value"
              @change="(item) => handleSelectInputChange(item, component.name)"
            >
              <template #2xx-item-content="{ item }">
                <ResponseCodeDot
                  v-if="item?.key"
                  response-code="2xx"
                />
                {{ item?.label }}
              </template>
              <template #4xx-item-content="{ item }">
                <ResponseCodeDot
                  v-if="item?.key"
                  response-code="4xx"
                />
                {{ item?.label }}
              </template>
            </SelectDropdown>
          </div>
        </HttpResponse>
      </div>
      <div
        class="right"
        :data-testid="`http-operation-right-${operationData.id}`"
      >
        <TryIt
          v-model="excludeNotRequiredInTryIt"
          :data="operationData"
          :request-body="currentRequestBody"
          :server-url="selectedServerURL"
          @access-tokens-changed="setAuthHeaders"
          @request-body-changed="setRequestBody"
          @request-headers-changed="setRequestHeaders"
          @request-path-changed="setRequestPath"
          @request-query-changed="setRequestQuery"
          @server-url-changed="setServerUrl"
        />
        <RequestSample
          v-if="currentServerUrl && currentRequestPath"
          v-model="excludeNotRequiredInSample"
          :auth-headers="authHeaders"
          :auth-query="authQuery"
          :custom-headers="currentRequestHeaders"
          :data="operationData"
          :request-body="currentRequestBody"
          :request-path="currentRequestPath"
          :request-query="currentRequestQuery"
          :server-url="currentServerUrl"
          @request-body-sample-idx-changed="setRequestBodyByIdx"
        />
        <ResponseSample
          v-if="activeResponseContentList?.length"
          :content-list="activeResponseContentList"
          :content-type="activeContentType"
          :response-code="activeResponseCode"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import type { PropType, Ref } from 'vue'
import type { IHttpOperation, IHttpWebhookOperation } from '@stoplight/types'
import HttpRequest from './endpoint/HttpRequest.vue'
import HttpResponse from './endpoint/HttpResponse.vue'
import TryIt from './try-it/TryIt.vue'
import RequestSample from './samples/RequestSample.vue'
import ResponseSample from './samples/ResponseSample.vue'
import ServerEndpoint from './endpoint/ServerEndpoint.vue'
import PageHeader from '../common/PageHeader.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import ResponseCodeDot from '@/components/common/ResponseCodeDot.vue'
import { getSamplePath, getSampleQuery, getSampleBody, removeTrailingSlash } from '@/utils'
import useCurrentResponse from '@/composables/useCurrentResponse'
import { ResponseSelectComponent } from '@/types'
import type { SelectItem } from '@/types'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation | IHttpWebhookOperation>,
    required: true,
  },
})

const hideTryIt = inject<Ref<boolean>>('hide-tryit', ref(false))

const authHeaders = ref<Array<Record<string, string>>>()
const authQuery = ref<string>('')
const excludeNotRequiredInTryIt = ref<boolean>(true)
const excludeNotRequiredInSample = ref<boolean>(true)

const operationData = computed(() => ({
  ...props.data,
  name: 'name' in props.data ? props.data.name : props.data.summary || props.data.iid || props.data.path,
  path: 'path' in props.data ? props.data.path : '',
}))

const excludeNotRequired = computed((): boolean => {
  return hideTryIt.value ? excludeNotRequiredInSample.value : excludeNotRequiredInTryIt.value
})

const setAuthHeaders = (newHeaders: Array<Record<string, string>>, newAuthQuery: string) => {
  authHeaders.value = newHeaders
  authQuery.value = newAuthQuery
}

const serverList = computed(() => props.data.servers?.map(server => removeTrailingSlash(server.url)) ?? [])

// this is the server selected by user, defaults to first server in the list
const selectedServerURL = ref<string>(serverList.value?.[0] ?? '')
const currentServerUrl = ref<string>(serverList.value?.[0] ?? '')
const currentRequestPath = ref<string>('')
const currentRequestQuery = ref<string>('')
const currentRequestHeaders = ref<Array<Record<string, string>>>([])
const currentRequestBody = ref<string>('')

// refs and computed properties to manage currently active response object
const responseList = computed(() => props.data.responses ?? [])
const {
  activeResponseDescription,
  activeResponseCode,
  activeContentType,
  activeResponseContentList,
  responseSelectComponentList,
} = useCurrentResponse(responseList)

function handleSelectInputChange(item: SelectItem, componentName: ResponseSelectComponent) {
  if (componentName === ResponseSelectComponent.ResponseCodeSelectMenu) {
    activeResponseCode.value = item.value
  } else if (componentName === ResponseSelectComponent.ContentTypeSelectMenu) {
    activeContentType.value = item.value
  }
}

// this is fired when server url parameters in tryIt section getting changed
const setServerUrl = (newServerUrl: string) => {
  currentServerUrl.value = newServerUrl
}

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
  selectedServerURL.value = url
  currentServerUrl.value = url
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

    .http-operation-response {
      .http-response-header-menu {
        align-items: center;
        display: inline-flex;
        gap: var(--kui-space-20, $kui-space-20);

        :deep(.trigger-button) {
          @include small-bordered-trigger-button;
        }
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
