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
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="20"
        />
        <h5>Authentication</h5>
        <TryItButton />
      </div>
      <div class="right-card-body">
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
</template>

<script setup lang="ts">
import { inject, computed, ref } from 'vue'
import type { PropType, Ref } from 'vue'
import { LockIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import TryItButton from './TryItButton.vue'
import type { IHttpOperation, HttpSecurityScheme } from '@stoplight/types'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'access-tokens-changed', authHeaders: Array<Record<string, string>>): void
}>()

/* for now we only have one header so we will return is as 1 element array */
const accessTokenChanged = (e: Event) => {
  const tokenValue = (e.target as HTMLInputElement).value
  const authHeaders = []
  if (tokenValue) {
    authHeaders.push({
      name: 'Authorization',
      value: `Bearer ${(e.target as HTMLInputElement).value}`,
    })
  }
  emit('access-tokens-changed', authHeaders)
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
  return !hideTryIt.value && Array.isArray(props.data.servers) && props.data.servers.length > 0
})

</script>

<style lang="scss" scoped>
.right-card {

  .right-card-header {
    .tryit-btn {
      margin-left: auto;
    }
  }

  .right-card-body {
    display: grid;
    grid-template-columns: 1fr 1fr;

    .left,
    .right {
      display: flex;
      flex-direction: column;
      margin: $kui-space-50 $kui-space-40;
    }

    input,
    select {
      border: 1px solid $kui-color-border;
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
    .right-card-body {
      grid-template-columns: 1fr;
    }
  }
}
</style>
