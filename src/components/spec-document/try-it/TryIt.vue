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


    <CollapsablePanel
      v-if="showTryIt && security?.length"
      :data-testid="`tryit-${data.id}`"
    >
      <template #header>
        <LockIcon
          v-if="security?.length"
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="20"
        />
        <h5>
          Authentication
        </h5>
      </template>

      <template #left>
        <label>Method</label>
        <select>
          <option
            v-for="sec in security"
            :key="sec.id"
          >
            {{ sec.key }} ({{ sec.type }})
          </option>
        </select>
      </template>

      <template #right>
        <label>Access Token</label>
        <input
          placeholder="App credential"
          @keyup="accessTokenChanged"
        >
      </template>
    </CollapsablePanel>

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
import { LockIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import TryItButton from './TryItButton.vue'
import { getRequestHeaders } from '@/utils'
import composables from '@/composables'
import type { IHttpOperation, HttpSecurityScheme } from '@stoplight/types'
import MethodBadge from '@/components/common/MethodBadge.vue'
import CodeBlock from '@/components/common/CodeBlock.vue'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'


const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  requestUrl: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'access-tokens-changed', authHeaders: Array<Record<string, string>>): void
}>()
const { getHighlighter } = composables.useShiki()

const response = ref<Response>('aaa')
const responseText = ref<string>('bbbb')

const doApiCall = async () => {
  try {
    // Todo - deal with params and body
    response.value = await fetch(`${props.requestUrl}`, {
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

const authHeaders = ref<Array<Record<string, string>>>()

/* for now we only have one header so we will return is as 1 element array */
const accessTokenChanged = (e: Event) => {
  const tokenValue = (e.target as HTMLInputElement).value
  authHeaders.value = []
  if (tokenValue) {
    authHeaders.value.push({
      name: 'Authorization',
      // TODO: this migh be a query string, not a header, handle this case
      value: `Bearer ${(e.target as HTMLInputElement).value}`,
    })
  }
  emit('access-tokens-changed', authHeaders.value)
}

const security = computed((): HttpSecurityScheme[]|undefined => {
  const secArray:Array<HttpSecurityScheme> = []
  if (props.data.security) {
    props.data.security.forEach((secGroup: HttpSecurityScheme[]) => {
      (secGroup || []).forEach((sec: HttpSecurityScheme) => {
        secArray.push(sec)
      })
    })
  }
  return secArray
})

// this is tryout state requested by property passed
const hideTryIt = inject<Ref<boolean>>('hide-tryit', ref(false))

// there is more logic that drives do we show tryouts or not
const showTryIt = computed((): boolean => {
  // if there are no services defined in overView we do not show tryIt
  return !hideTryIt.value && Array.isArray(props.data.servers) && !!props.data.servers.length
})

watch(() => ({
  data: props.data,
  requestUrl: props.requestUrl,
}), () => {
  responseText.value = ''
  response.value = undefined

})

</script>

<style lang="scss" scoped>

.tryit-header {
  align-items: center;
  display: flex;
  padding: $kui-space-40;
  padding-right: $kui-space-0!important;
  .path {
    margin-left: $kui-space-20;
  }
  .tryit-btn {
    margin-left: auto;
  }
}


input,
select {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  box-sizing: border-box;
  padding: $kui-space-40 $kui-space-50;
  width: 100%;
}

label {
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-medium;
  line-height: $kui-line-height-30;
}
</style>
