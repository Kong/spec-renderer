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
          :description="activeResponse?.description"
        >
          <div class="http-response-header-menu">
            <select
              v-for="component in responseSelectComponentList"
              :key="component.name"
              :name="component.name"
              :value="component.value"
              @change="component.onChange"
              @click.stop
            >
              <option
                v-for="option in component.optionList"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
          </div>
        </HttpResponse>
      </div>
      <div
        class="right"
        :data-testid="`http-operation-right-${data.id}`"
      >
        <TryIt
          :data="data"
          :server-url="selectedServerURL"
          @access-tokens-changed="setAuthHeaders"
          @request-path-changed="setRequestPath"
          @request-query-changed="setRequestQuery"
          @server-url-changed="setServerUrl"
        />
        <RequestSample
          :auth-headers="authHeaders"
          :data="data"
          :request-path="currentRequestPath"
          :request-query="currentRequestQuery"
          :server-url="currentServerUrl"
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
import { getSamplePath, getSampleQuery, removeTrailingSlash } from '@/utils'
import composables from '@/composables'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})
const authHeaders = ref<Array<Record<string, string>>>()

const setAuthHeaders = (newHeaders: Array<Record<string, string>>) => {
  authHeaders.value = newHeaders
}

const serverList = computed(() => props.data.servers?.map(server => removeTrailingSlash(server.url)) ?? [])

// this is the server selected by user, defaults to first server in the list
const selectedServerURL = ref<string>(serverList.value?.[0] ?? '')
const currentServerUrl = ref<string>(serverList.value?.[0] ?? '')
const currentRequestPath = ref<string>('')
const currentRequestQuery = ref<string>('')

// refs and computed properties to manage currently active response object
const responseList = computed(() => props.data.responses ?? [])
const {
  activeResponse,
  activeResponseContentList,
  responseSelectComponentList,
} = composables.useCurrentResponse(responseList)

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

function updateSelectedServerURL(url: string) {
  selectedServerURL.value = url
  currentServerUrl.value = url
}

watch(() => (props.data.id), () => {
  currentRequestPath.value = getSamplePath(props.data)
  currentRequestQuery.value = getSampleQuery(props.data)
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
      padding: var(--kui-space-40, $kui-space-40);
    }

    .http-operation-response {
      .http-response-header-menu {
        align-items: center;
        display: inline-flex;
        gap: var(--kui-space-20, $kui-space-20);

        select {
          border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
          border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
          color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
          font-family: var(--kui-font-family-code, $kui-font-family-code);
          font-size: var(--kui-font-size-20, $kui-font-size-20);
          line-height: var(--kui-line-height-20, $kui-line-height-20);
          outline: none;
          padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30) var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
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
