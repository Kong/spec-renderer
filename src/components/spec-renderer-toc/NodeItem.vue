<template>
  <li
    class="node-item"
    :data-spec-renderer-toc-active="isActive ? true : undefined"
  >
    <a
      :class="{ 'single-word': isSingleWord, 'active': isActive }"
      :href="`${basePath}${navigationType==='hash' ? '#' : ''}${item.id}`"
      @click.prevent="selectItem(item.id)"
    >
      <span class="node-item-title">
        {{ item.title }}
      </span>

      <MethodBadge
        v-if="item.type === NodeType.HttpOperation"
        class="http-operation-badge"
        :inverted="isActive"
        :method="item.meta"
      />
    </a>
  </li>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { PropType, Ref } from 'vue'
import type { TableOfContentsNode } from '../../stoplight/elements-core/components/Docs/types'
import MethodBadge from '../common/MethodBadge.vue'
import { NodeType } from '@stoplight/types'
import type { NavigationTypes } from '@/types'

const props = defineProps({
  item: {
    type: Object as PropType<TableOfContentsNode>,
    required: true,
  },
  activePath: {
    type: String,
    default: '/',
  },
})

const basePath = inject<Ref<string>>('base-path', ref<string>(''))
const navigationType = inject<Ref<NavigationTypes>>('navigation-type', ref<NavigationTypes>('path'))

const emit = defineEmits<{
  (e: 'item-selected', id: string): void,
}>()

const isSingleWord = computed(() => !props.item.title?.trim()?.includes(' '))
const isActive = computed(() => props.activePath === props.item.id)


const selectItem = (id: string): void => {
  emit('item-selected', id)
}
</script>

<style lang="scss" scoped>
.node-item {
  list-style-type: none;
  scroll-margin-bottom: var(--kui-space-40, $kui-space-40);
  scroll-margin-top: var(--kui-space-40, $kui-space-40);

  a {
    @include toc-item;

    &.single-word {
      .node-item-title {
        @include truncate;

        display: block;
      }
    }

    .http-operation-badge {
      margin-left: var(--kui-space-auto, $kui-space-auto);
      pointer-events: none;
    }
  }
}
</style>
