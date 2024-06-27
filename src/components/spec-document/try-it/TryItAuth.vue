<template>
  <CollapsablePanel
    v-if="security?.length"
    :data-testid="`tryit-auth-${data.id}`"
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

    <!-- body -->
    <div class="short">
      <InputLabel required>
        Method
      </InputLabel>
      <select>
        <option
          v-for="sec in security"
          :key="sec.id"
        >
          {{ sec.key }} ({{ sec.type }})
        </option>
      </select>
    </div>

    <div class="short">
      <InputLabel required>
        Access Token
      </InputLabel>
      <input
        placeholder="App credential"
        type="text"
        @keyup="accessTokenChanged"
      >
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import { LockIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import type { IHttpOperation, HttpSecurityScheme } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import InputLabel from '@/components/common/InputLabel.vue'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'access-tokens-changed', authHeaders: Array<Record<string, string>>): void
}>()

const authHeaders = ref<Array<Record<string, string>>>()

/* for now we only have one header so we will return is as 1 element array */
const accessTokenChanged = (e: Event) => {
  const tokenValue = (e.target as HTMLInputElement).value
  authHeaders.value = []
  if (tokenValue) {
    authHeaders.value.push({
      name: 'Authorization',
      // TODO: this might be a query string, not a header, handle this case
      value: `Bearer ${(e.target as HTMLInputElement).value}`,
    })
  }
  emit('access-tokens-changed', authHeaders.value)
}

const security = computed((): HttpSecurityScheme[] | undefined => {
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
</script>

<style lang="scss" scoped>
.kui-icon {
  margin-right: var(--kui-space-30, $kui-space-30);
}

input {
  @include input-default;
}
</style>
