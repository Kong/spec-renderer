<template>
  <div
    ref="popoverWrapperRef"
    class="popover"
    data-testid="popover"
    v-bind="sanitizedAttrs"
  >
    <div
      ref="triggerWrapperRef"
      class="popover-trigger-wrapper"
    >
      <slot />
    </div>

    <Transition name="spec-renderer-fade">
      <div
        v-if="isVisible"
        ref="popoverRef"
        :aria-activedescendant="attrs['aria-activedescendant'] ? String(attrs['aria-activedescendant']) : undefined"
        :aria-labelledby="attrs['aria-labelledby'] ? String(attrs['aria-labelledby']) : undefined"
        class="popover-container"
        :class="[`popover-${placement}`, popoverClasses]"
        data-testid="popover-container"
        :role="role"
        :style="floatingStyles"
        :x-placement="placement"
        v-bind="attrs.id ? { id: String(attrs.id) } : {}"
      >
        <div
          class="popover-content"
          :style="popoverStyles"
        >
          <slot name="content" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, useAttrs } from 'vue'
import type { PropType } from 'vue'
import { useFloating, autoUpdate, offset, flip } from '@floating-ui/vue'
import type { Placement } from '@floating-ui/vue'
import { PopoverPlacementVariants } from '@/types'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  placement: {
    type: String as PropType<Placement>,
    validator: (value: Placement): boolean => PopoverPlacementVariants.includes(value),
    default: 'bottom-start',
  },
  popoverOffset: {
    type: Number,
    default: 6,
  },
  role: {
    type: String,
    default: 'listbox',
  },
  openOnMouseover: {
    type: Boolean,
    default: false,
  },
  closeOnPopoverClick: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  maxWidth: {
    type: String,
    default: 'auto',
  },
  width: {
    type: String,
    default: 'auto',
  },
  maxHeight: {
    type: String,
    default: 'auto',
  },
  popoverClasses: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['open', 'close'])

const attrs = useAttrs()

/**
 * Remove id, aria-activedescendant and aria-labelledby from attrs because we bind them to the popover container.
 */
const sanitizedAttrs = computed(() => {
  const strippedAttrs = { ...attrs }

  delete strippedAttrs.id
  delete strippedAttrs['aria-activedescendant']
  delete strippedAttrs['aria-labelledby']

  return strippedAttrs
})

const popoverWrapperRef = ref<HTMLElement | null>(null)
const triggerWrapperRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const isVisible = ref<boolean>(false)

const popoverTrigger = computed((): HTMLElement | null => triggerWrapperRef.value && triggerWrapperRef.value?.children[0] ? triggerWrapperRef.value?.children[0] as HTMLElement : null)

const timer = ref<number | null>(null)

const togglePopover = () => {
  if (!isVisible.value) {
    showPopover()
  } else {
    hidePopover()
  }
}

const showPopover = async () => {
  if (!props.disabled) {
    if (timer.value) {
      clearTimeout(timer.value)
    }

    isVisible.value = true
  }
}

const hidePopover = () => {
  if (window) {
    timer.value = window.setTimeout(() => {
      isVisible.value = false
    }, props.openOnMouseover ? 300 : 0)
  }
}

const clickHandler = (event: Event) => {
  const target = event.target as HTMLElement

  if (popoverTrigger.value?.contains(target) && !popoverRef.value?.contains(target)) {
    // toggle popover if clicked within the trigger

    togglePopover()
  } else if (popoverRef.value?.contains(target) && !triggerWrapperRef.value?.contains(target)) {
    // close the popover if closeOnPopoverClick is true

    if (props.closeOnPopoverClick) {
      hidePopover()
    }
  } else if (isVisible.value && !popoverWrapperRef.value?.contains(target)) {
    // close popover if clicked outside of the popover

    hidePopover()
  }
}

const popoverStyles = computed(() => {
  return {
    maxWidth: props.maxWidth,
    width: props.width,
    maxHeight: props.maxHeight,
  }
})

const { floatingStyles } = useFloating(popoverTrigger, popoverRef, {
  placement: props.placement,
  middleware: [offset(props.popoverOffset), flip()],
  strategy: 'fixed',
  transform: false,
  whileElementsMounted: autoUpdate,
})

defineExpose({
  hidePopover,
})

onMounted(() => {
  if (document) {
    // handle various click events to determine how to handle the click event in a generic clickHandler function
    // we don't set any other click event listeners on purpose to avoid conflict of event listeners
    document?.addEventListener('click', clickHandler)

    if (popoverTrigger.value && props.openOnMouseover) {
      popoverTrigger.value.addEventListener('mouseenter', showPopover)
      popoverTrigger.value.addEventListener('focus', showPopover)
      popoverTrigger.value.addEventListener('mouseleave', hidePopover)
      popoverTrigger.value.addEventListener('blur', hidePopover)
    }

    if (popoverRef.value && props.openOnMouseover) {
      popoverRef.value.addEventListener('mouseenter', showPopover)
      popoverRef.value.addEventListener('focusin', showPopover)
      popoverRef.value.addEventListener('mouseleave', hidePopover)
      popoverRef.value.addEventListener('focusout', hidePopover)
    }
  }
})

onBeforeUnmount(() => {
  if (document) {
    document?.removeEventListener('click', clickHandler)

    if (popoverTrigger.value && props.openOnMouseover) {
      popoverTrigger.value.removeEventListener('mouseenter', showPopover)
      popoverTrigger.value.removeEventListener('focus', showPopover)
      popoverTrigger.value.removeEventListener('mouseleave', hidePopover)
      popoverTrigger.value.removeEventListener('blur', hidePopover)
    }

    if (popoverRef.value && props.openOnMouseover) {
      popoverRef.value.removeEventListener('mouseenter', showPopover)
      popoverRef.value.removeEventListener('focusin', showPopover)
      popoverRef.value.removeEventListener('mouseleave', hidePopover)
      popoverRef.value.removeEventListener('focusout', hidePopover)
    }
  }
})

watch(isVisible, (val) => {
  if (val) {
    emit('open')
  } else {
    emit('close')
  }
})
</script>

<style lang="scss" scoped>
.popover {
  .popover-container {
    z-index: 1000;
  }
}
</style>
