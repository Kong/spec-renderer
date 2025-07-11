<template>
  <Teleport to="body">
    <div
      v-bind="attrs"
      class="slideout"
    >
      <Transition name="spec-renderer-fade">
        <div
          v-show="visible"
          class="slideout-backdrop"
          @click="emit('close')"
        />
      </Transition>
      <Transition name="spec-renderer-slide-in">
        <div
          v-show="visible"
          ref="slideoutContainerRef"
          class="slideout-container"
          data-testid="slideout-container"
        >
          <div class="slideout-header">
            <span
              v-if="title"
              class="slideout-title"
            >
              {{ title }}
            </span>
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
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, onUnmounted, watch, useAttrs } from 'vue'
import { CloseIcon } from '@kong/icons'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  /**
   * Max width of SlideOut container.
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

const toggleBodyScroll = (isActive: boolean): void => {
  if (typeof document !== 'undefined') {
    if (isActive) {
      document.scrollingElement?.classList.add('spec-renderer-no-scroll')
    } else {
      document.scrollingElement?.classList.remove('spec-renderer-no-scroll')
    }
  }
}

watch(() => props.visible, async (visible: boolean): Promise<void> => {
  if (visible) {
    toggleEventListeners(true)
    toggleBodyScroll(true)
  } else {
    toggleEventListeners(false)
    toggleBodyScroll(false)
  }
}, { immediate: true })

onUnmounted(() => {
  toggleEventListeners(false)
  toggleBodyScroll(false)
})
</script>

<style lang="scss" scoped>
@use '@/styles/styles' as *;

.slideout {
  .slideout-container {
    background-color: var(--kui-color-background, $kui-color-background);
    border-left: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    box-shadow: var(--kui-shadow, $kui-shadow);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    height: 100vh;
    inset: 0;
    overflow-y: auto;
    position: fixed;
    width: 100%;
    z-index: 1000;

    @media (min-width: $kui-breakpoint-mobile) {
      max-width: v-bind('props.maxWidth');
    }

    .slideout-header {
      border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      display: flex;
      padding: var(--kui-space-40, $kui-space-40);

      .slideout-title {
        display: flex;
        flex: 1;
        font-family: var(--kui-font-family-text, $kui-font-family-text);
        font-size: var(--kui-font-size-50, $kui-font-size-50);
        font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
        gap: var(--kui-space-40, $kui-space-40);
        line-height: var(--kui-line-height-40, $kui-line-height-40);
      }

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

<style lang="scss">
// must be unscoped since it's targeting the body element
.spec-renderer-no-scroll {
  overflow: hidden;
}
</style>
