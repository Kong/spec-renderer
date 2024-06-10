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

    <CollapsablePanel
      v-if="response"
      :data-testid="`tryit-response-${data.id}`"
    >
      <template #header>
        <h5>
          Response
        </h5>
      </template>

      <CodeBlock
        v-if="responseText"
        :code="responseText"
      />
    </CollapsablePanel>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref, watch } from 'vue'
import type { PropType, Ref } from 'vue'
import TryItButton from './TryItButton.vue'
import { getRequestHeaders } from '@/utils'
import composables from '@/composables'
import type { IHttpOperation } from '@stoplight/types'
import MethodBadge from '@/components/common/MethodBadge.vue'
import CodeBlock from '@/components/common/CodeBlock.vue'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import TryItAuth from './TryItAuth.vue'
import TryItServer from './TryItServer.vue'


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

const { getHighlighter } = composables.useShiki()

const response = ref<Response | undefined>()
const responseText = ref<string>()

const authHeaders = ref<Array<Record<string, string>>>()

const currentServerUrl = ref<string>(props.serverUrl)

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
    const highlighter = await getHighlighter()
    responseText.value = highlighter.codeToHtml(JSON.stringify((await response.value.json()), null, 2), { lang: 'json', theme: 'material-theme-palenight' })

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
  padding: $kui-space-40 0;
  .path {
    margin-left: $kui-space-20;
  }
  .tryit-btn {
    margin-left: auto;
  }
}

/* using deep as this thing is used in multiple child components */
:deep(input), :deep(select) {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  box-sizing: border-box;
  padding: $kui-space-40 $kui-space-50;
  width: 100%;
}

:deep(label) {
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-medium;
  line-height: $kui-line-height-30;
}
</style>
