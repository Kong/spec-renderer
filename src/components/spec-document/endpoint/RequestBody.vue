<template>
  <div>
    <h4>Body</h4>

    <div>{{ requestBody.description }}</div>

    <div v-if="requestBody.contents">
      <template
        v-for="content in requestBody.contents"
        :key="content.id"
      >
        <ModelNode
          v-if="content.schema"
          :data="content.schema"
          :title="content.schema.title ?? 'Request Body Schema Model'"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import ModelNode from '../ModelNode.vue'
import type { IHttpOperationRequestBody } from '@stoplight/types'

defineProps({
  requestBody: {
    type: Object as PropType<IHttpOperationRequestBody>,
    required: true,
  },
})
</script>
