<template>
  <li
    class="node-item"
    :data-testid="`${isActive ? 'node-item-active' : 'node-item'}`"
  >
    <a
      :class="{ 'single-word': isSingleWord, 'selected': isActive }"
      :href="`${basePath}${item.id}`"
      @click.prevent="selectItem(item.id)"
    >
      {{ item.title }}

      <NodeItemBadge
        v-if="item.type === 'http_operation'"
        class="http-operation-badge"
        :method="item.meta"
      />
    </a>
  </li>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { PropType, Ref } from 'vue'
import type { TableOfContentsNode } from '../../stoplight/elements-core/components/Docs/types'
import NodeItemBadge from './NodeItemBadge.vue'

const props = defineProps({
  item: {
    type: Object as PropType<TableOfContentsNode>,
    required: true,
  },
})

const basePath = inject<Ref<string>>('base-path', ref<string>(''))
const currentPath = inject<Ref<string>>('current-path', ref<string>(''))

const emit = defineEmits<{
  (e: 'item-selected', id: string): void,
  (e: 'expand'): void,
}>()

const selectItem = (id: string): void => {
  emit('item-selected', id)
}

const isSingleWord = computed(() => !props.item.title?.trim()?.includes(' '))
const isActive = computed(() => currentPath.value === props.item.id)

/**
 * Watch current path and emit the event if the current path matches the item.
 */
watch(currentPath, (val) => {
  if (val && val === props.item.id) {
    emit('expand')
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/mixins';

.node-item {
  list-style-type: none;

  a {
    @include toc-item;

    &.single-word {
      @include truncate;

      display: block;
    }

    .http-operation-badge {
      margin-left: var(--kui-space-auto, $kui-space-auto);
      pointer-events: none;
    }
  }
}
</style>
