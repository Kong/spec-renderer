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
        <section v-if="Array.isArray(data.responses) && data.responses.length">
          <h4>Responses</h4>
          <HttpResponse
            v-for="response in data.responses"
            :key="response.code"
            :response="response"
          />
        </section>
      </div>
      <div
        class="right"
        :data-testid="`http-operation-right-${data.id}`"
      >
        <TryIt
          :data="data"
          :server-url="selectedServerURL"
          @access-tokens-changed="setAuthHeaders"
          @server-url-changed="setServerUrl"
        />
        <RequestSample
          :auth-headers="authHeaders"
          :data="data"
          :server-url="currentServerUrl"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import HttpRequest from './endpoint/HttpRequest.vue'
import HttpResponse from './endpoint/HttpResponse.vue'
import TryIt from './try-it/TryIt.vue'
import RequestSample from './samples/RequestSample.vue'
import ServerEndpoint from './endpoint/ServerEndpoint.vue'
import PageHeader from '../common/PageHeader.vue'

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
// this is the server selected by user, defaults to first server in the list
const selectedServerURL = ref<string>(props.data.servers?.[0]?.url ?? '')
const currentServerUrl = ref<string>(props.data.servers?.[0]?.url ?? '')

// this is fired when server url paramters in tryIt section getting changed
const setServerUrl = (newServerUrl: string) => {
  currentServerUrl.value = newServerUrl
}
const serverList = computed(() => props.data.servers?.map(server => server.url) ?? [])

function updateSelectedServerURL(url: string) {
  selectedServerURL.value = url
  currentServerUrl.value = url
}

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
