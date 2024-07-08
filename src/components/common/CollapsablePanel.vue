<template>
  <div class="collapsable-panel">
    <div
      class="panel-header"
      :class="{ 'collapsed': isCollapsed, 'collapsible': collapsible }"
      @click="toggleState"
    >
      <slot name="header" />

      <div class="btn-container">
        <CopyButton
          v-if="contentToCopy && !isCollapsed"
          :content="contentToCopy"
        />
        <button
          v-if="collapsible"
          :aria-expanded="!isCollapsed"
          class="collapse-trigger-btn"
          type="button"
        >
          <ChevronRightIcon
            v-if="isCollapsed"
            class="chevron-icon"
          />
          <ChevronDownIcon
            v-if="!isCollapsed"
            class="chevron-icon"
          />
        </button>
      </div>
    </div>
    <!-- TODO ADD expand/collapse/copy content-->
    <div
      v-show="!isCollapsed"
      class="panel-body"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRightIcon, ChevronDownIcon } from '@kong/icons'
import CopyButton from './CopyButton.vue'

const props = defineProps({
  collapsible: {
    type: Boolean,
    default: true,
  },
  contentToCopy: {
    type: String,
    default: '',
  },
})

const isCollapsed = ref<boolean>(props.collapsible)
const toggleState = (e: Event) => {
  if (props.collapsible && (e.target as HTMLElement).nodeName !== 'SELECT') {
    isCollapsed.value = !isCollapsed.value
  }
}
</script>

<style lang="scss" scoped>
.collapsable-panel {
  margin-top: var(--kui-space-40, $kui-space-40)!important;

  .panel-header {
    align-items: center;
    background-color: var(--kui-color-background, $kui-color-background);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-top-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    border-top-right-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    display: flex;
    flex-flow: row;
    padding: var(--kui-space-50, $kui-space-50);

    &.collapsible {
      cursor: pointer;
    }

    &.collapsed {
      border-bottom-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
      border-bottom-right-radius: var(--kui-border-radius-30, $kui-border-radius-30);
      :deep(select) {
        display: none;
      }
    }
    .btn-container {
      padding-left: var(--kui-space-30, $kui-space-30);

      .collapse-trigger-btn {
        background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
        border: none;
        cursor: pointer;
        padding: 0px;
        .chevron-icon {
          @include toggle-icon;
        }
      }
    }

    :deep(>h5) {
      color: var(--kui-color-text, $kui-color-text);
      flex: 1;
      font-size: var(--kui-font-size-30, $kui-font-size-30)!important;
      padding: var(--kui-space-0, $kui-space-0);
    }
  }

  .panel-body {
    background-color: var(--kui-color-background, $kui-color-background);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-bottom-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    border-bottom-right-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    border-top: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;

    :deep(.short) {
      display: flex;
      flex-direction: column;
      margin: var(--kui-space-50, $kui-space-50) var(--kui-space-40, $kui-space-40);
      row-gap: var(--kui-space-40, $kui-space-40);
    }

    :deep(.wide) {
      display: flex;
      flex-direction: column;
      grid-column: 1 / 3;
      margin: var(--kui-space-30, $kui-space-30) var(--kui-space-40, $kui-space-40);
      row-gap: var(--kui-space-40, $kui-space-40);
    }
  }

  @media (max-width: ($kui-breakpoint-mobile - 1px)) {
    .panel-body {
      grid-template-columns: 1fr;
      :deep(.wide) {
        grid-column: 1;
      }
    }
  }
}
</style>
