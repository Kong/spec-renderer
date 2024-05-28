<template>
  <div
    class="request-sample-wrapper"
    :data-testid="`request-sample-${data.id}`"
  >
    <h5>REQUEST SAMPLE</h5>
    <div class="tryit-card">
      <div class="tryit-card-header">
        <select>
          <option
            v-for="lang in requestLanguages"
            :key="lang"
          >
            {{ lang }}
          </option>
        </select>
      </div>
      <div class="tryit-card-body">
        Here is where the code goes
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const requestLanguages = [
  'JSON', 'cURL', 'Python', 'Node', 'Javascript', 'Go', 'Ruby',
]
</script>
