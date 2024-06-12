<template>
  <div
    class="tryit-wrapper"
    :data-testid="`tryit-wrapper-${data.id}`"
  >
    <div class="tryit-header">
      <MethodBadge
        :method="data.method"
        size="small"
      />
      <span class="path">{{ data.path }}</span>

      <TryItButton
        v-if="showTryIt"
        class="tryit-btn"
        :data="data"
        @tryit-api-call="doApiCall"
      />
    </div>

    <TryItAuth
      v-if="showTryIt"
      :data="data"
      @access-tokens-changed="accessTokenChanged"
    />

    <TryItServer
      :data="data"
      :server-url="serverUrl"
      @server-url-changed="serverUrlChanged"
    />

    <TryItParams :data="data" />

    <CollapsablePanel
      v-if="response"
      :data-testid="`tryit-response-${data.id}`"
    >
      <template #header>
        <h5>
          Response
        </h5>
      </template>

      <div class="wide">
        <CodeBlock
          v-if="responseText"
          :code="responseText"
          lang="json"
        />
      </div>
    </CollapsablePanel>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref, watch } from 'vue'
import type { PropType, Ref } from 'vue'
import TryItButton from './TryItButton.vue'
import { getRequestHeaders } from '@/utils'
import type { IHttpOperation } from '@stoplight/types'
import MethodBadge from '@/components/common/MethodBadge.vue'
import CodeBlock from '@/components/common/CodeBlock.vue'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import TryItAuth from './TryItAuth.vue'
import TryItServer from './TryItServer.vue'
import TryItParams from './TryItParams.vue'


const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  serverUrl: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'access-tokens-changed', authHeaders: Array<Record<string, string>>): void
  (e: 'server-url-changed', serverUrl: string): void
}>()


const response = ref<Response | undefined>()
const responseText = ref<string>()

const authHeaders = ref<Array<Record<string, string>>>()

const currentServerUrl = ref<string>(props.serverUrl)

/*
this is the result of emitting an event inside of TryItServer, when user changes server variables
as a result of this we need to set new value for currentServerUrl in this component to use in actual fetch
and promote it one level up so RequestSample component has correct Url.
*/
const serverUrlChanged = (newServerUrl: string) => {
  currentServerUrl.value = newServerUrl
  emit('server-url-changed', newServerUrl)
}

// this is tryout state requested by property passed
const hideTryIt = inject<Ref<boolean>>('hide-tryit', ref(false))

const doApiCall = async () => {
  try {
    // Todo - deal with params and body
    response.value = await fetch(`${currentServerUrl.value}${props.data.path}`, {
      method: props.data.method,
      headers: [
        ...(authHeaders?.value || []),
        ...getRequestHeaders(props.data),
      ].reduce((acc, current) => {
        acc[current.name] = current.value; return acc
      }, { }),
    })
    responseText.value = JSON.stringify((await response.value.json()), null, 2)

  } catch (error) {
    console.error(error)
  }
}

/* pass trough one level up as it needs to change Request sample */
const accessTokenChanged = (newHeaders: Array<Record<string, string>>) => {
  emit('access-tokens-changed', newHeaders)
  authHeaders.value = newHeaders
}

// there is more logic that drives do we show tryouts or not
const showTryIt = computed((): boolean => {
  // if there are no services defined in overView we do not show tryIt
  return !hideTryIt.value && Array.isArray(props.data.servers) && !!props.data.servers.length
})

watch(() => props.serverUrl, () => {
  currentServerUrl.value = props.serverUrl
})

watch(() => ({
  data: props.data,
  serverUrl: currentServerUrl,
}), () => {
  responseText.value = ''
  response.value = undefined
})

</script>

<style lang="scss" scoped>

.tryit-header {
  align-items: center;
  display: flex;
  padding: var(--kui-space-40, $kui-space-40) var(--kui-space-0, $kui-space-0);
  .path {
    margin-left: var(--kui-space-20, $kui-space-20);
  }
  .tryit-btn {
    margin-left: auto;
  }
}

/* using deep as this thing is used in multiple child components */
:deep(input), :deep(select) {
  border: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  box-sizing: border-box;
  padding: var(--kui-space-40, $kui-space-40) var(--kui-space-50, $kui-space-50);
  width: 100%;
}

:deep(label) {
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
}
</style>
