<template>
  <li
    class="node-item"
    :data-spec-renderer-toc-active="isActive ? true : undefined"
  >
    <a
      :class="{ 'single-word': isSingleWord, 'active': isActive }"
      :href="`${basePath}${navigationType==='hash' ? '#' : ''}${item.id}`"
      :title="itemTitle"
      @click.prevent="selectItem(item.id)"
    >
      <span
        class="node-item-title"
        :class="{ 'deprecated-node-item': item.deprecated }"
      >
        {{ item.title }}
      </span>

      <MethodBadge
        v-if="item.type === NodeType.HttpOperation || item.type === NodeType.HttpWebhook"
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
import { NodeType } from '@/types'
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
const itemTitle = computed(() => props.item.deprecated ? `${props.item.title} (deprecated)` : props.item.title)


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
