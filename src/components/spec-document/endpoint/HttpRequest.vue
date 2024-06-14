<template>
  <section data-testid="endpoint-http-request">
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
import BodyContentList from './BodyContentList.vue'

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
  if (body.value?.contents?.length) {
    list.push({
      component: BodyContentList,
      componentProps: {
        description: body.value.description,
        contents: body.value.contents,
        defaultModelTitle: 'Request Body Schema Model',
        readonlyVisible: false,
      },
      key: 'body',
    })
  }

  return list
})
</script>
