<template>
  <li
    class="group-item"
    :class="{ root: root }"
  >
    <!-- TODO: a11y aria-controls -->
    <button
      ref="collapseTriggerRef"
      :aria-expanded="!isCollapsed"
      type="button"
      @click="onClick"
    >
      {{ item.title }}

      <ChevronRightIcon
        class="chevron-icon"
        :class="{ 'expanded': !isCollapsed }"
      />
    </button>

    <Transition name="spec-renderer-fade">
      <!-- TODO: a11y id (aria-controls) -->
      <ul v-show="!isCollapsed">
        <component
          :is="itemComponent(child)"
          v-for="(child, idx) in item.items"
          :key="idx + ' ' + child.title+child"
          :item="child"
          :root="isGroup(child) ? false : undefined"
          @expand="onExpand"
          @item-selected="selectItem"
        />
      </ul>
    </Transition>
  </li>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue'
import type { TableOfContentsGroup } from '../../stoplight/elements-core/components/Docs/types'
import { itemComponent, isGroup } from './index'
import { ChevronRightIcon } from '@kong/icons'

const props = defineProps({
  item: {
    type: Object as PropType<TableOfContentsGroup>,
    required: true,
  },
  /**
   * Whether this is the root group item (otherwise it's a child of another group item)
   */
  root: {
    type: Boolean,
    default: true,
  },
  /**
   * Initial state of collapse
   */
  collapsed: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits<{
  (e: 'item-selected', id: string): void,
  (e: 'expand'): void,
}>()

const selectItem = (id: any) => {
  isCollapsed.value = false

  emit('item-selected', id)
}

const isCollapsed = ref<boolean>(props.collapsed)
const collapseTriggerRef = ref<HTMLElement | null>(null)

const onClick = (event: Event) => {
  if (collapseTriggerRef.value === event.target) {
    isCollapsed.value = !isCollapsed.value
  }
}

const onExpand = () => {
  isCollapsed.value = false

  emit('expand')
}
</script>

<style lang="scss" scoped>
@import '@/styles/styles';
@import '@/styles/mixins/mixins';

@mixin group-spacing {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-20, $kui-space-20);
}

.group-item {
  @include group-spacing;

  list-style-type: none;

  button {
    @include default-button-reset;
    @include toc-item;
  }

  ul {
    @include group-spacing;

    padding-left: var(--kui-space-40, $kui-space-40);
  }

  &.root {
    padding-top: var(--kui-space-70, $kui-space-70);
    padding-bottom: var(--kui-space-70, $kui-space-70);

    & + .group-item.root {
      border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    }

    > button {
      color: var(--kui-color-text, $kui-color-text);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      line-height: var(--kui-line-height-20, $kui-line-height-20);
      text-transform: uppercase;
    }

    > ul {
      padding-left: var(--kui-space-0, $kui-space-0);
    }
  }
}
</style>
