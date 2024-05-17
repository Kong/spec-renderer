<template>
  <section>
    <h4>Request</h4>
    <template
      v-for="{ component, componentProps, key } in componentList"
      :key="key"
    >
      <component
        :is="component"
        v-if="componentProps"
        v-bind="componentProps"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperationRequestBody, IHttpPathParam, IHttpQueryParam } from '@stoplight/types'
import QueryParamList from './QueryParamList.vue'
import PathParamList from './PathParamList.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps({
  query: {
    type: Array as PropType<Array<IHttpQueryParam>>,
    default: () => [],
  },
  path: {
    type: Array as PropType<Array<IHttpPathParam>>,
    default: () => [],
  },
  body: {
    type: Object as PropType<IHttpOperationRequestBody>,
    default: () => {},
  },
})

const componentList = computed(() => {
  const list: Array<{ component: any; componentProps: any; key: string }> = []

  const { body, query, path } = toRefs(props)

  if (query.value?.length) {
    list.push({
      component: QueryParamList,
      componentProps: {
        queryParamList: query.value,
      },
      key: 'query',
    })
  }
  if (path.value?.length) {
    list.push({
      component: PathParamList,
      componentProps: {
        pathParamList: path.value,
      },
      key: 'path',
    })
  }
  if (body.value?.id) {
    list.push({
      component: RequestBody,
      componentProps: {
        requestBody: body.value,
      },
      key: 'body',
    })
  }

  return list
})
</script>
