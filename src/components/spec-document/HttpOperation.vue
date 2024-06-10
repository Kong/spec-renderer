<template>
  <div
    class="http-operation"
    :data-testid="`http-operation-${data.id}`"
  >
    <section class="http-operation-header">
      <h1 class="title">
        {{ data.summary }}
      </h1>
      <p class="description">
        {{ data.description }}
      </p>
      <ServerEndpoint
        v-if="serverList.length"
        class="http-operation-server-endpoint"
        :method="data.method"
        :path="data.path"
        :selected-server-url="selectedServerURL"
        :server-url-list="serverList"
        @selected-server-changed="updateSelectedServerURL"
      />
    </section>

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
          :request-url="`${selectedServerURL}${data.path}`"
          @access-tokens-changed="setAuthHeaders"
        />
        <RequestSample
          :auth-headers="authHeaders"
          :data="data"
          :request-url="`${selectedServerURL}${data.path}`"
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

const serverList = computed(() => props.data.servers?.map(server => server.url) ?? [])

function updateSelectedServerURL(url: string) {
  selectedServerURL.value = url
}

</script>

<style lang="scss" scoped>
.http-operation {
  * {
    margin: var(--kui-space-0, $kui-space-0);
  }

  .http-operation-header {
    @include page-header;

    .http-operation-server-endpoint {
      margin-top: var(--kui-space-80, $kui-space-80);
    }
    margin-bottom: var(--kui-space-90, $kui-space-90);
  }

  .http-operation-container  {
    display: grid;
    gap: $kui-space-10;
    grid-template-columns: 1.2fr 0.8fr;
    width: 100%;

    .left {
      color: var(--kui-color-text, $kui-color-text);
      padding-right: var(--kui-space-50, $kui-space-50);
    }
    .right {
      background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
      padding: $kui-space-40;
    }
  }
  // TODO change when we have floating TOC for smaller width
  @media (max-width: $kui-breakpoint-laptop) {
    .http-operation-container {
      grid-template-columns: 1fr;

      .right {
        margin-top: $kui-space-40;
      }
    }
  }
}

</style>
