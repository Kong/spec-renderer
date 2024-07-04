<template>
  <div class="slideout">
    <Transition name="spec-renderer-fade">
      <div
        v-if="visible"
        class="slideout-backdrop"
        @click="emit('close')"
      />
    </Transition>
    <Transition name="spec-renderer-slide-in">
      <div
        v-if="visible"
        ref="slideoutContainerRef"
        class="slideout-container"
        data-testid="slideout-container"
      >
        <div class="slideout-header">
          <button
            aria-label="Close"
            class="slideout-close-icon"
            data-testid="slideout-close-icon"
            type="button"
            @click="$emit('close')"
          >
            <CloseIcon
              class="close-icon"
              decorative
            />
          </button>
        </div>
        <div class="slideout-content">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, onUnmounted, watch } from 'vue'
import { CloseIcon } from '@kong/icons'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  /**
   * The max-width of the slideout. **Default: `500px`**.
   */
  maxWidth: {
    type: String,
    required: false,
    default: '500px',
  },
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const slideoutContainerRef = ref<HTMLElement | null>(null)

const handleClose = (e: any): void => {
  // close on escape key
  if ((props.visible && e.keyCode === 27)) {
    emit('close')
  }
}

const toggleEventListeners = (isActive: boolean): void => {
  if (typeof document !== 'undefined') {
    if (isActive) {
      document?.addEventListener('keydown', handleClose)
    } else {
      document?.removeEventListener('keydown', handleClose)
    }
  }
}

watch(() => props.visible, async (visible: boolean): Promise<void> => {
  if (visible) {
    toggleEventListeners(true)
  } else {
    toggleEventListeners(false)
  }
}, { immediate: true })

onUnmounted(() => {
  toggleEventListeners(false)
})
</script>

<style lang="scss" scoped>
@import '@/styles/styles';

.slideout {
  .slideout-container {
    background-color: var(--kui-color-background, $kui-color-background);
    border-left: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    box-shadow: var(--kui-shadow, $kui-shadow);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: var(--kui-space-50, $kui-space-50);
    height: 100vh;
    left: 0;
    max-width: v-bind('props.maxWidth');
    overflow-y: auto;
    padding: var(--kui-space-70, $kui-space-70) var(--kui-space-0, $kui-space-0) var(--kui-space-0, $kui-space-0) var(--kui-space-70, $kui-space-70);
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;

    .slideout-header {
      display: flex;
      padding-right: var(--kui-space-70, $kui-space-70);

      .slideout-close-icon {
        @include default-button-reset;

        border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
        margin-left: auto;
        outline: none;

        .close-icon {
          color: var(--kui-color-text-neutral, $kui-color-text-neutral) !important;
        }

        &:hover,
        &:focus {
          .close-icon {
            color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong) !important;
          }
        }
      }
    }

    .slideout-content {
      box-sizing: border-box;
      color: var(--kui-color-text, $kui-color-text);
      display: flex;
      flex-direction: column;
      font-family: var(--kui-font-family-text, $kui-font-family-text);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
      overflow-y: auto;
      padding-right: var(--kui-space-70, $kui-space-70);

      :deep(> *:last-child) {
        padding-bottom: var(--kui-space-70, $kui-space-70); // add padding to the last child to add some spacing before bottom of the container
      }
    }
  }

  .slideout-backdrop {
    background: var(--kui-color-background-overlay, $kui-color-background-overlay);
    inset: 0;
    position: fixed;
    z-index: 1000;
  }
}
</style>
