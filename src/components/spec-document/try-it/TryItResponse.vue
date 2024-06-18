<template>
  <CollapsablePanel
    :data-testid="`tryit-response-${data.id}`"
  >
    <template #header>
      <h5>
        Response {{ response?.status }}
      </h5>
    </template>

    <div class="wide">
      <CodeBlock
        v-if="responseText"
        :code="responseText"
        lang="json"
      />
    </div>

    <div class="wide">
      <CodeBlock
        v-if="errorText"
        :code="errorText"
      />
    </div>

    <div class="wide">
      <CodeBlock
        v-if="headersText"
        :code="headersText"
      />
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CodeBlock from '@/components/common/CodeBlock.vue'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import type { IHttpOperation } from '@stoplight/types'
import type { PropType } from 'vue'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  response: {
    type: Object as PropType<Response>,
    default: () =>{ },
  },
  responseText: {
    type: String,
    default: '',
  },
  responseError: {
    type: Object as PropType<Error>,
    default: () => { },
  },
})

const errorText = computed(():string => {
  console.log('errorText:', props.responseError)
  return props.responseError.message
})

const headersText = computed((): string => {
  console.log('headersText:', props.response?.headers)

  props.response?.headers?.forEach(h=> {
    console.log('hhhh:', h)
  })
  return '???'

})
</script>