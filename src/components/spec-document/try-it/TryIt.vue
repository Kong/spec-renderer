<template>
  <div
    class="tryit-wrapper"
    :data-testid="`tryit-wrapper-${data.id}`"
  >
    <div
      v-if="showTryItPanel"
      class="right-card"
      :data-testid="`tryit-${data.id}`"
    >
      <div class="right-card-header">
        <LockIcon
          v-if="security?.length"
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="20"
        />
        <h5>
          {{ security?.length ? 'Authentication' : 'Try It' }}
        </h5>
        <TryItButton @tryit-api-call="doApiCall" />
      </div>
      <div class="right-card-body">
        <div v-if="security?.length">
          <div class="left">
            <label>Method</label>
            <select>
              <option
                v-for="sec in security"
                :key="sec.id"
              >
                {{ sec.key }} ({{ sec.type }})
              </option>
            </select>
          </div>
          <div class="right">
            <label>Access Token</label>
            <input
              placeholder="App credential"
              @keyup="accessTokenChanged"
            >
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="response"
      class="right-card"
      :data-testid="`tryit-response-${data.id}`"
    >
      <div class="right-card-header">
        <h5>
          Response
        </h5>
      </div>
      <div class="right-card-body">
        <!-- eslint-disable vue/no-v-html -->
        <div
          v-if="responseText"
          class="one-column"
          v-html="responseText"
        />
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref, watch } from 'vue'
import type { PropType, Ref } from 'vue'
import { LockIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import TryItButton from './TryItButton.vue'
import { getRequestHeaders } from '../../../utils'
import composables from '@/composables'
import type { IHttpOperation, HttpSecurityScheme } from '@stoplight/types'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  baseServerUrl: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'access-tokens-changed', authHeaders: Array<Record<string, string>>): void
}>()
const { getHighlighter } = composables.useShiki()

const response = ref<Response>()
const responseText = ref<string>()

const doApiCall = async () => {
  console.log('here: ', 'doApiCall')
  try {
    // Todo - deal with params and body
    response.value = await fetch(`${props.baseServerUrl}/${props.data.path}`, {
      method: props.data.method,
      headers: [
        ...(authHeaders?.value || []),
        ...getRequestHeaders(props.data),
      ].reduce((acc, current) => { acc[current.name] = current.value; return acc }, { }),
    })
    console.log(response.value)
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
const showTryItPanel = computed((): boolean => {
  // if there are no services defined in overView we do not show tryIt
  return !hideTryIt.value && Array.isArray(props.data.servers) && !!props.data.servers.length
})

watch(() => ({
  data: props.data,
  baseServerUrl: props.baseServerUrl,
}), () => {
  responseText.value = ''
  response.value = undefined

})

</script>

<style lang="scss" scoped>
.right-card {

  .right-card-header {
    .tryit-btn {
      margin-left: auto;
    }
  }

  .right-card-body>div {
    display: grid;
    grid-template-columns: 1fr 1fr;

    &.one-column {
      grid-template-columns: 1fr;
    }

    .left,
    .right {
      display: flex;
      flex-direction: column;
      margin: $kui-space-50 $kui-space-40;
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
  }

  @media (max-width: $kui-breakpoint-mobile) {
    .right-card-body>div {
      grid-template-columns: 1fr;
    }
  }
}
</style>
