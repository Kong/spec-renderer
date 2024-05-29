<template>
  <li
    ref="nodeItemRef"
    class="node-item"
  >
    <a
      :class="{ 'single-word': isSingleWord, 'selected': currentPath === item.id }"
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
  /**
   * Fires when an element is selected, used for scrolling to the element.
   * We want a separate event for this because element might not be there in the DOM sometimes - so we don't want to hang 'item-selected' on that.
   */
  (e: 'element-selected', element: HTMLElement): void,
}>()

const nodeItemRef = ref<HTMLElement | null>(null)

const selectItem = (id: string): void => {
  emit('item-selected', id)
}

const isSingleWord = computed(() => !props.item.title?.trim()?.includes(' '))

watch(currentPath, (val) => {
  if (val && val === props.item.id) {
    selectItem(props.item.id)
  }

}, { immediate: true })

watch(nodeItemRef, (val) => {
  if (val) {
    if (currentPath.value === props.item.id) {
      emit('element-selected', val)
    }
  }
})
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
