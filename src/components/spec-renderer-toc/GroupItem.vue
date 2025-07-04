<template>
  <li
    class="group-item"
    :class="{ root: root }"
    data-testid="group-item"
  >
    <button
      v-if="!item.hideTitle"
      ref="collapseTriggerRef"
      :aria-controls="collapseGroupId"
      :aria-expanded="isExpanded"
      data-testid="group-item-button"
      type="button"
      @click="onClick"
    >
      {{ item.title }}

      <ChevronRightIcon
        class="chevron-icon"
        :class="{ 'expanded': isExpanded }"
      />
    </button>

    <Transition name="spec-renderer-fade">
      <ul
        v-show="isExpanded"
        :id="collapseGroupId"
        data-testid="group-item-list"
      >
        <component
          :is="itemComponent(child)"
          v-for="(child, idx) in item.items"
          :key="idx + ' ' + child.title + child"
          :active-path="activePath"
          :item="child"
          :root="isGroup(child) ? false : undefined"
          @item-selected="selectItem"
        />
      </ul>
    </Transition>
  </li>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { TableOfContentsGroup } from '@/stoplight/elements-core'
import { itemComponent, isGroup } from './index'
import { ChevronRightIcon } from '@kong/icons'
import { slugify } from '@/utils'

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
  activePath: {
    type: String,
    default: '/',
  },
})

const emit = defineEmits<{
  (e: 'item-selected', id: string): void
}>()

// make sure the collapse group id is unique
const collapseGroupId = `spec-renderer-toc-group-${slugify(props.item.title)}-${slugify(props.item.items[0].title)}`

const selectItem = (id: any) => {
  emit('item-selected', id)
}

const isExpanded = ref<boolean>(props.item.hideTitle || props.item.initiallyExpanded)
const collapseTriggerRef = ref<HTMLElement | null>(null)


const onClick = (event: Event) => {
  if (collapseTriggerRef.value === event.target) {
    isExpanded.value = !isExpanded.value
  }
}
watch(() => (props.item.initiallyExpanded), (newValue) => {
  isExpanded.value = newValue
})
</script>

<style lang="scss" scoped>
@use '@/styles/styles' as *;

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
    padding-bottom: var(--kui-space-70, $kui-space-70);
    padding-top: var(--kui-space-70, $kui-space-70);

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
