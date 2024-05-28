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
        :data="data"
        :overview-data="overviewData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperation, IHttpService } from '@stoplight/types'
import HttpRequest from './endpoint/HttpRequest.vue'
import HttpResponse from './endpoint/HttpResponse.vue'
import TryIt from './try-it/TryIt.vue'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  overviewData: {
    type: Object as PropType<IHttpService>,
    default: () => ({}),
  },
})

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
