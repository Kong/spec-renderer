<template>
  <div
    class="document-navigation"
    :class="{'single-item': neighborComponentList.length === 1}"
  >
    <a
      v-for="(component) in neighborComponentList"
      :key="component.type"
      class="document-navigation-link"
      :class="component.type"
      :data-testid="`document-navigation-link-${component.type}`"
      :href="`${basePath}${navigationType==='hash' ? '#' : ''}${component.uri}`"
      @click.prevent="selectItem(component.uri)"
    >

      <ArrowLeftIcon
        v-if="component.type === 'previous'"
        :color="KUI_COLOR_TEXT_PRIMARY"
        decorative
        :size="KUI_ICON_SIZE_40"
      />
      <ArrowRightIcon
        v-else
        :color="KUI_COLOR_TEXT_PRIMARY"
        decorative
        :size="KUI_ICON_SIZE_40"
      />
      <span class="navigation-title">
        {{ component.name }}
        <MethodBadge
          v-if="component.method"
          :method="component.method"
          size="small"
        />
      </span>

    </a>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, ArrowRightIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40, KUI_COLOR_TEXT_PRIMARY } from '@kong/design-tokens'
import MethodBadge from '../common/MethodBadge.vue'
import type { PropType } from 'vue'
import type { DocumentNavigationItem } from '@/types'

defineProps({
  neighborComponentList: {
    type: Array as PropType<Array<DocumentNavigationItem>>,
    required: true,
  },
  basePath: {
    type: String,
    required: true,
  },
  navigationType: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'item-selected', id: string): void,
}>()

const selectItem = (newUrl: string): void => {
  emit('item-selected', newUrl)
}
</script>

<style lang="scss" scoped>
.document-navigation {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--kui-space-90, $kui-space-90);
  justify-content: center;
  padding: var(--kui-space-90, $kui-space-90) var(--kui-space-0, $kui-space-0);

  &.single-item {
    justify-content: left;
  }

  .document-navigation-link {
    align-items: center;
    background-color: var(--kui-color-background, $kui-color-background);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
    display: flex;
    flex: 1;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    gap: var(--kui-space-50, $kui-space-50);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    max-width: 524px;
    min-width: 250px;
    padding: var(--kui-space-70, $kui-space-70);
    text-decoration: none;
    transition:
      color var(--kui-animation-duration-20, $kui-animation-duration-20) ease,
      background-color var(--kui-animation-duration-20, $kui-animation-duration-20) ease;

    &:hover {
      background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
      color: var(--kui-color-text-neutral-strongest, $kui-color-text-neutral-strongest);
    }

    &.next {
      flex-direction: row-reverse;
    }

    .navigation-title {
      align-items: center;
      display: flex;
      gap: var(--kui-space-30, $kui-space-30);
    }
  }
}
</style>
