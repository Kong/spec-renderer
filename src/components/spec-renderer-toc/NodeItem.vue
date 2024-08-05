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
      <span
        class="node-item-title"
        :class="{ 'deprecated-node-item': item.deprecated }"
      >
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
})

const basePath = inject<Ref<string>>('base-path', ref<string>(''))
const currentPath = inject<Ref<string>>('current-path', ref<string>(''))
const navigationType = inject<Ref<NavigationTypes>>('navigation-type', ref<NavigationTypes>('path'))

const emit = defineEmits<{
  (e: 'item-selected', id: string): void,
}>()

const selectItem = (id: string): void => {
  emit('item-selected', id)
}

const isSingleWord = computed(() => !props.item.title?.trim()?.includes(' '))
const isActive = computed(() => currentPath.value === props.item.id)
</script>

<style lang="scss" scoped>
.node-item {
  list-style-type: none;

  a {
    @include toc-item;

    &.single-word {
      .node-item-title {
        @include truncate;

        display: block;
      }
    }

    > .deprecated-node-item {
      text-decoration: line-through;
    }

    .http-operation-badge {
      margin-left: var(--kui-space-auto, $kui-space-auto);
      pointer-events: none;
    }
  }
}
</style>
