<template>
  <div
    class="http-operation-container"
    :data-testid="`http-operation-${data.id}`"
  >
    <div
      class="left"
      :data-testid="`http-operation-left-${data.id}`"
    >
      <section>
        <h3>{{ data.summary }}</h3>
        <p>{{ data.description }}</p>
      </section>

      <ServerEndpoint
        v-if="serverList.length"
        :method="data.method"
        :path="data.path"
        :selected-server-url="selectedServerURL"
        :server-url-list="serverList"
        @selected-server-changed="updateSelectedServerURL"
      />

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
        v-if="showTryIt"
        :data="data"
        :overview-data="overviewData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref } from 'vue'
import type { PropType, Ref } from 'vue'
import type { IHttpOperation, IHttpService } from '@stoplight/types'
import HttpRequest from './endpoint/HttpRequest.vue'
import HttpResponse from './endpoint/HttpResponse.vue'
import TryIt from './try-it/TryIt.vue'
import ServerEndpoint from './endpoint/ServerEndpoint.vue'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  overviewData: {
    type: Object as PropType<IHttpService>,
    default: () => ({}),
  },
})

// this is the server selected by user, defaults to first server in the list
const selectedServerURL = ref<string>(props.data.servers?.[0].url ?? '')

// this is tryout state requested by property passed
const hideTryIt = inject<Ref<boolean>>('hide-tryit', ref(false))

// there is more logic that drives do we show tryouts or not
const showTryIt = computed((): boolean => {
  // if there are no services defined in overView we do not show tryIt
  return !hideTryIt.value && Array.isArray(props.overviewData.servers) && props.overviewData.servers.length > 0
})

const serverList = computed(() => props.data.servers?.map(server => server.url) ?? [])

function updateSelectedServerURL(url: string) {
  selectedServerURL.value = url
}

</script>

<style lang="scss" scoped>
.http-operation-container  {
  display: grid;
  gap: $kui-space-10;
  grid-template-columns: 1.2fr 0.8fr;
  width: 100%;
  .left {
    padding: $kui-space-30;
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
</style>
