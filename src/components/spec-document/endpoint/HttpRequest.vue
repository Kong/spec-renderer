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
import type { IHttpOperationRequestBody, IHttpPathParam, IHttpQueryParam, IHttpHeaderParam } from '@stoplight/types'
import RequestParamList from './RequestParamList.vue'
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
  headers: {
    type: Array as PropType<Array<IHttpHeaderParam>>,
    default: () => [],
  },
  titlePrefix: {
    type: String,
    default: '',
  },
})

const componentList = computed(() => {
  const list: Array<{ component: any; componentProps: any; key: string }> = []

  const { body, query, path, headers } = toRefs(props)
  const titlePrefixWithSpace = props.titlePrefix + ' '

  if (query.value?.length) {
    list.push({
      component: RequestParamList,
      componentProps: {
        paramList: query.value,
        title: `${titlePrefixWithSpace}Query Parameters`,
        'data-testid': 'endpoint-query-param-list',
      },
      key: 'query',
    })
  }
  if (path.value?.length) {
    list.push({
      component: RequestParamList,
      componentProps: {
        paramList: path.value,
        title: `${titlePrefixWithSpace}Path Parameters`,
        'data-testid': 'endpoint-path-param-list',
      },
      key: 'path',
    })
  }
  if (headers.value?.length) {
    list.push({
      component: RequestParamList,
      componentProps: {
        paramList: headers.value,
        title: `${titlePrefixWithSpace}Headers`,
        'data-testid': 'endpoint-header-param-list',
      },
      key: 'headers',
    })
  }
  if (body.value?.contents?.length) {
    list.push({
      component: RequestBody,
      componentProps: {
        description: body.value.description,
        contents: body.value.contents,
        readonlyVisible: false,
        title: `${titlePrefixWithSpace}Body`,
      },
      key: 'body',
    })
  }

  return list
})
</script>
