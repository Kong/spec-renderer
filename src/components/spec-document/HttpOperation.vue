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
import { inject, computed } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation, IHttpService } from '@stoplight/types'
import HttpRequest from './endpoint/HttpRequest.vue'
import HttpResponse from './endpoint/HttpResponse.vue'
import TryIt from './try-it/TryIt.vue'

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

// this is tryout state requested by property passed
const hideTryIt = inject<string>('hide', '')

// there is more logic that drives do we show tryouts or not
const showTryIt = computed((): boolean => {
  // if there are no services defined in overView we do not show tryIt
  return !hideTryIt && Array.isArray(props.data.servers) && props.data.servers.length > 0
})

</script>

<style lang="scss" scoped>
.http-operation-container  {
  display: flex;
  width: 100%;
  .left {
    width: 60%;
  }
  .right {
    background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
    width:40%
  }
}

// TODO change when we have floating TOC for smaller width
@media (max-width: $kui-breakpoint-laptop) {
  .http-operation-container {
    display: block;

    .left {
      width: 100%;
    }

    .right {
      margin-top: $kui-space-80;
      width: 100%;
    }
  }
}
</style>
