<template>
  <div
    class="http-operation"
    :data-testid="`http-operation-${data.id}`"
  >
    <PageHeader
      v-if="data.summary"
      class="http-operation-header"
      :description="data.description"
      :title="data.summary"
    >
      <ServerEndpoint
        v-if="serverList.length"
        class="http-operation-server-endpoint"
        :data-testid="`server-endpoint-${data.id}`"
        :method="data.method"
        :path="data.path"
        :selected-server-url="selectedServerURL"
        :server-url-list="serverList"
        @selected-server-changed="updateSelectedServerURL"
      />
    </PageHeader>


    <section class="http-operation-container">
      <div
        class="left"
        :data-testid="`http-operation-left-${data.id}`"
      >
        <HttpRequest
          v-if="data.request"
          v-bind="data.request"
        />

        <HttpResponse
          class="http-operation-response"
          :content-list="activeResponseContentList"
          :description="activeResponseDescription"
        >
          <div class="http-response-header-menu">
            <SelectDropdown
              v-for="component in responseSelectComponentList"
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
        :data-testid="`http-operation-right-${data.id}`"
      >
        <TryIt
          :data="data"
          :request-body="currentRequestBody"
          :server-url="selectedServerURL"
          @access-tokens-changed="setAuthHeaders"
          @request-body-changed="setRequestBody"
          @request-path-changed="setRequestPath"
          @request-query-changed="setRequestQuery"
          @server-url-changed="setServerUrl"
        />
        <RequestSample
          :auth-headers="authHeaders"
          :auth-query="authQuery"
          :data="data"
          :request-body="currentRequestBody"
          :request-path="currentRequestPath"
          :request-query="currentRequestQuery"
          :server-url="currentServerUrl"
          @request-body-sample-idx-changed="setRequestBodyByIdx"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import HttpRequest from './endpoint/HttpRequest.vue'
import HttpResponse from './endpoint/HttpResponse.vue'
import TryIt from './try-it/TryIt.vue'
import RequestSample from './samples/RequestSample.vue'
import ServerEndpoint from './endpoint/ServerEndpoint.vue'
import PageHeader from '../common/PageHeader.vue'
import { getSamplePath, getSampleQuery, getSampleBody, removeTrailingSlash } from '@/utils'
import composables from '@/composables'
import { ResponseSelectComponent } from '@/types'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import ResponseCodeDot from '@/components/common/ResponseCodeDot.vue'
import type { SelectItem } from '@/types'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})
const authHeaders = ref<Array<Record<string, string>>>()
const authQuery = ref<string>('')

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
const currentRequestBody = ref<string>('')

// refs and computed properties to manage currently active response object
const responseList = computed(() => props.data.responses ?? [])
const {
  activeResponseDescription,
  activeResponseCode,
  activeContentType,
  activeResponseContentList,
  responseSelectComponentList,
} = composables.useCurrentResponse(responseList)

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

const setRequestBody = (newBody: string) => {
  currentRequestBody.value = newBody
}

const setRequestBodyByIdx = (newSampleIdx: number) => {
  currentRequestBody.value = getSampleBody(props.data, newSampleIdx)
}

function updateSelectedServerURL(url: string) {
  selectedServerURL.value = url
  currentServerUrl.value = url
}

watch(() => (props.data.id), () => {
  currentRequestPath.value = getSamplePath(props.data)
  currentRequestQuery.value = getSampleQuery(props.data)
  currentRequestBody.value = getSampleBody(props.data, 0)
}, { immediate: true })
</script>

<style lang="scss" scoped>
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
    grid-template-columns: 1.2fr 0.8fr;
    width: 100%;

    .left {
      color: var(--kui-color-text, $kui-color-text);
      padding-right: var(--kui-space-50, $kui-space-50);
    }
    .right {
      background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
      padding: var(--kui-space-0, $kui-space-0);
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
  }
  // TODO change when we have floating TOC for smaller width
  @media (max-width: ($kui-breakpoint-laptop - 1px)) {
    .http-operation-container {
      grid-template-columns: 1fr;

      .right {
        margin-top: var(--kui-space-40, $kui-space-40);
      }
    }
  }
}
</style>
