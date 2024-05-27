<template>
  <li
    class="group-item"
    :class="{ root: root }"
  >
    <button
      ref="collapseTriggerRef"
      :aria-controls="collapseGroupId"
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
      <ul
        v-show="!isCollapsed"
        :id="collapseGroupId"
      >
        <component
          :is="itemComponent(child)"
          v-for="(child, idx) in item.items"
          :key="idx + ' ' + child.title+child"
          :item="child"
          :root="false"
          @item-selected="selectItem"
        />
      </ul>
    </Transition>
  </li>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue'
import type { TableOfContentsGroup } from '../../stoplight/elements-core/components/Docs/types'
import { itemComponent } from './index'
import { randomUUID } from 'uncrypto'
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
  (e: 'item-selected', id: string): void
}>()

const selectItem = (id: any) => {
  emit('item-selected', id)
}

const collapseGroupId = randomUUID()

const isCollapsed = ref<boolean>(props.collapsed)
const collapseTriggerRef = ref<HTMLElement | null>(null)

const onClick = (event: Event) => {
  if (collapseTriggerRef.value === event.target) {
    isCollapsed.value = !isCollapsed.value
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/styles.scss';
@import 'src/styles/mixins/mixins.scss';

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
    padding: var(--kui-space-70, $kui-space-70);

    &:first-of-type {
      background-color: red;
    }

    & + .group-item.root {
      border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    }

    > button {
      color: var(--kui-color-text, $kui-color-text);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      line-height: var(--kui-line-height-20, $kui-line-height-20);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      text-transform: uppercase;
    }

    > ul {
      padding-left: var(--kui-space-0, $kui-space-0);
    }
  }
}
</style>
