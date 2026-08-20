<template>
  <div
    ref="slideout"
    class="slideout"
  >
    <div class="slideout-viewport">
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
  </div>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { CloseIcon } from '@kong/icons'

const {
  visible = false,
  title = '',
  maxWidth = '500px',
  documentScrollingContainer = '',
} = defineProps<{
  visible?: boolean
  title?: string
  /**
   * Max width of SlideOut container.
  */
  maxWidth?: string
  /**
   * Selector for the element that scrolls the content behind the SlideOut.
   * Falls back to the document's own scrolling element when not provided or not found.
   */
  documentScrollingContainer?: string
}>()

const slideoutRef = useTemplateRef('slideout')

// Scroll container to lock and measure against: an explicit selector if given, else the nearest real scrolling ancestor.
const resolveScrollingContainer = (): Element | null => {
  if (documentScrollingContainer) {
    const explicit = document.querySelector(documentScrollingContainer)
    if (explicit) {
      return explicit
    }
  }

  // walk up to the nearest ancestor that actually scrolls (overflow-y: auto/scroll)
  let current = slideoutRef.value?.parentElement ?? null
  while (current && !/auto|scroll/.test(getComputedStyle(current).overflowY)) {
    current = current.parentElement
  }
  return current
}

// Visible height below the sticky root, measured once on open (scroll is locked while open, so it can't change).
const viewportHeight = ref('100dvh')

const updateViewportHeight = (): void => {
  const el = slideoutRef.value
  if (!el) {
    viewportHeight.value = '100dvh'
    return
  }

  const scrollParent = resolveScrollingContainer()

  // document.scrollingElement's own box spans all its content, not just the viewport - use window.innerHeight
  // instead, which also covers the "whole page scrolls" case (no scrolling ancestor found).
  const visibleBottom = scrollParent && scrollParent !== document.scrollingElement
    ? scrollParent.getBoundingClientRect().bottom
    : window.innerHeight

  viewportHeight.value = `${visibleBottom - el.getBoundingClientRect().top}px`
}

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleClose = (e: any): void => {
  // close on escape key
  if ((visible && e.keyCode === 27)) {
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
    // falls back to the document's own scrolling element (usually <html>) if no scrolling ancestor is found
    const scrollLockElement = resolveScrollingContainer() ?? document.scrollingElement

    if (isActive) {
      scrollLockElement?.classList.add('spec-renderer-no-scroll')
    } else {
      scrollLockElement?.classList.remove('spec-renderer-no-scroll')
    }
  }
}

watch(() => visible, async (visible: boolean): Promise<void> => {
  if (visible) {
    updateViewportHeight() // must run before the scroll lock, which hides the scrolling ancestor's overflow
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
  height: 0;
  left: 0;
  pointer-events: none;
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;

  // gives the absolutely-positioned children a box to fill, since the sticky root above has zero height
  .slideout-viewport {
    height: v-bind('viewportHeight');
    position: relative;
    width: 100%;
  }

  .slideout-container {
    background-color: var(--kui-color-background, $kui-color-background);
    border-left: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    box-shadow: var(--kui-shadow, $kui-shadow);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    height: 100%;
    inset: 0;
    overflow-y: auto;
    pointer-events: auto;
    position: absolute;
    width: 100%;
    z-index: 1000;

    @media (min-width: $kui-breakpoint-mobile) {
      max-width: v-bind('maxWidth');
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
    height: 100%;
    inset: 0;
    pointer-events: auto;
    position: absolute;
    z-index: 1000;
  }
}
</style>

<style lang="scss">
// unscoped: targets an element outside this component (document or host-provided scroll container)
.spec-renderer-no-scroll {
  // !important: that element's own overflow rules can outrank this single-class selector
  overflow: hidden !important;
}
</style>
