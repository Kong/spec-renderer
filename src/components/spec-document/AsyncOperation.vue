<template>
  <div
    class="async-operation"
    :data-testid="`async-operation-${operationData.id}`"
  >
    <PageHeader
      v-if="operationData.name"
      class="async-operation-header"
      :deprecated="operationData.deprecated"
      :description="operationData.summary"
      :title="operationData.name"
    >
      <ServerEndpoint
        v-if="serverList.length"
        class="async-operation-server-endpoint"
        :data-testid="`server-endpoint-${operationData.id}`"
        :method="operationData.method"
        :selected-server-url="serverList[0] ?? ''"
        :server-url-list="serverList"
      />
    </PageHeader>

    <div
      v-if="operationData.id"
      class="operation-prop"
    >
      Operation Id: <b>{{ operationData.id }}</b>
    </div>


    <MarkdownRenderer
      v-if="operationData.description"
      class="operation-description"
      data-testid="spec-renderer-async-message-description"
      :markdown="operationData.description"
    />


    <section class="async-operation-container">
      <RequestParamList
        v-if="requestParams"
        :param-list="requestParams"
        title="Parameters"
      />
    </section>
    <div v-if="acceptedMessages.length">
      <CollapsibleSection
        v-for="message in acceptedMessages"
        :key="message.messageId"
        :border-visible="false"
      >
        <template #title>
          <h2>
            {{ `Message accepted: ${message.messageId}` }}
          </h2>
        </template>
        <div class="accepted-collapsible-section-content">
          <AsyncMessage
            :data="message"
            title=""
          />
        </div>
      </CollapsibleSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { AsyncOperationObject, AsyncMessageObject } from '@/types'
import RequestParamList from './endpoint/RequestParamList.vue'
import ServerEndpoint from './endpoint/ServerEndpoint.vue'
import PageHeader from '../common/PageHeader.vue'
import type { IHttpParam } from '@stoplight/types'
import type { ChannelParameterInterface, MessageInterface } from '@asyncapi/parser'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import { transformSchema, transformMessage } from '@/utils/async-to-oas-transformer'
import CollapsibleSection from './endpoint/CollapsibleSection.vue'
import AsyncMessage from './AsyncMessage.vue'

const props = defineProps({
  data: {
    type: Object as PropType<AsyncOperationObject>,
    required: true,
  },
})



const channel = computed(() => (props.data.operation.channels().all()[0]))

//@ts-ignore ignore types for now
const serverList = computed(():string[] => ((props.data.operation.channels().all() || []).map(l => l.address()).filter(a=>(!!a))))

const operationData = computed((): Record<string, any> => {
  return {
    id: props.data.operation.id() || '',
    name: props.data.operation.id() || '',
    summary: props.data.operation.summary(),
    description: props.data.operation.description(),
    method: props.data.method,
    messages: props.data.operation.messages().all(),
  }
})

const acceptedMessages = computed((): AsyncMessageObject[] => {
  const resList: AsyncMessageObject[] = []

  props.data.operation.messages().all().forEach((message: MessageInterface)=> {
    resList.push(transformMessage(message).data)
  })
  return resList
})

const requestParams = computed(() => {
  const resList: IHttpParam[] = []
  channel.value.parameters().all().forEach((parameter: ChannelParameterInterface) => {
    //@ts-ignore ignore types for now
    resList.push({
      id: parameter.id(),
      name: parameter.id(),
      ...(parameter.hasSchema() ? { schema : transformSchema(parameter.schema()) } : null),
    })
  })
  return resList
})

</script>

<style lang="scss" scoped>
.async-operation {
  * {
    margin: var(--kui-space-0, $kui-space-0);
  }

  .async-operation-header {
    margin-bottom: var(--kui-space-90, $kui-space-90);
  }

  .async-operation-container  {
    display: grid;
    gap: var(--kui-space-10, $kui-space-10);
    width: 100%;
  }
  .operation-prop {
    padding-bottom: var(--kui-space-40, $kui-space-40);
    padding-top: var(--kui-space-40, $kui-space-40);
  }

  .operation-description {
    padding-top: var(--kui-space-40, $kui-space-40);
  }

  .accepted-collapsible-section-content {
    background: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    margin-top: var(--kui-space-20, $kui-space-20);
    padding: var(--kui-space-50, $kui-space-50);
  }
}
</style>
