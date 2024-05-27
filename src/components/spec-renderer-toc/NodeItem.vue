<template>
  <li class="node-item">
    <a
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
import { inject } from 'vue'
import type { PropType } from 'vue'
import type { TableOfContentsNode } from '../../stoplight/elements-core/components/Docs/types'
import NodeItemBadge from './NodeItemBadge.vue'

defineProps({
  item: {
    type: Object as PropType<TableOfContentsNode>,
    required: true,
  },
})

const basePath = inject<string>('base-path', '')

const emit = defineEmits<{
  (e: 'item-selected', id: string): void
}>()

const selectItem = (id: string): void => {
  emit('item-selected', id)
}
</script>

<style lang="scss" scoped>
@import 'src/styles/mixins/mixins.scss';

.node-item {
  list-style-type: none;

  a {
    @include toc-item;

    .http-operation-badge {
      margin-left: var(--kui-space-auto, $kui-space-auto);
      pointer-events: none;
    }
  }
}
</style>
