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

    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import type { PropType } from 'vue'
import type { IHttpPathParam, IHttpQueryParam, IHttpHeaderParam } from '@stoplight/types'
import RequestParamList from './RequestParamList.vue'
import { kebabCase } from '@/utils'

const props = defineProps({
  query: {
    type: Array as PropType<IHttpQueryParam[]>,
    default: () => [],
  },
  path: {
    type: Array as PropType<IHttpPathParam[]>,
    default: () => [],
  },
  headers: {
    type: Array as PropType<IHttpHeaderParam[]>,
    default: () => [],
  },
  basePathId: {
    type: String,
    default: '',
  },
  titlePrefix: {
    type: String,
    default: '',
  },
})

const componentList = computed(() => {
  const list: Array<{ component: any, componentProps: any, key: string }> = []

  const { query, path, headers } = toRefs(props)
  const titlePrefixWithSpace = props.titlePrefix + ' '

  if (query.value?.length) {
    list.push({
      component: RequestParamList,
      componentProps: {
        paramList: query.value,
        title: `${titlePrefixWithSpace}Query Parameters`,
        'data-testid': 'endpoint-query-param-list',
        ...(props.basePathId ? { basePathId: kebabCase(`${props.basePathId}-query`) } : null),
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
        ...(props.basePathId ? { basePathId: kebabCase(`${props.basePathId}-path`) } : null),
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
        ...(props.basePathId ? { basePathId: kebabCase(`${props.basePathId}-header`) } : null),
      },
      key: 'headers',
    })
  }

  return list
})
</script>
