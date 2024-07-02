<template>
  <div
    class="toggle-switch"
    :class="{ disabled }"
    v-bind="sanitizedAttrs"
  >
    <input
      ref="switchInputRef"
      :checked="toggleValue"
      :disabled="disabled"
      tabindex="-1"
      type="checkbox"
      v-bind="attrs.id ? { id: String(attrs.id) } : {}"
      @input="handleChange"
    >

    <div class="switch-control-wrapper">
      <span
        :aria-checked="toggleValue"
        v-bind="attrs.id ? { 'aria-labelledby': String(attrs.id) } : {}"
        class="switch-control"
        :class="{ 'checked': toggleValue, 'disabled': disabled }"
        data-testid="switch-control"
        role="checkbox"
        :tabindex="disabled ? -1 : 0"
        @click="propagateInputEvent"
        @keydown.space.prevent
        @keyup.space="propagateInputEvent"
      >

        <!-- white vertical bar that is visible when switch is enabled -->
        <span class="switch-control-enabled-bar" />
      </span>
    </div>

    <InputLabel
      v-if="label || $slots.label"
      v-bind="attrs.id ? { for: String(attrs.id) } : {}"
    >
      <slot name="label">
        {{ label }}
      </slot>
    </InputLabel>
  </div>
</template>

<script lang="ts" setup>
import { ref, useAttrs, computed } from 'vue'
import InputLabel from '@/components/common/InputLabel.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'change', val: boolean): void
  (e: 'input', val: boolean): void
}>()

const attrs = useAttrs()

/**
 * Remove id from attr because we bind it to the input element.
 */
const sanitizedAttrs = computed(() => {
  const strippedAttrs = { ...attrs }

  delete strippedAttrs.id

  return strippedAttrs
})

const toggleValue = defineModel<boolean>({ required: true })

const switchInputRef = ref<HTMLInputElement | null>(null)

const propagateInputEvent = (event: Event): void => {
  if (props.disabled) {
    return
  }

  if (event.type === 'click' || (event.type === 'keyup' && (event as KeyboardEvent).code === 'Space')) {
    switchInputRef.value?.click()
  }
}

const handleChange = (event: Event): void => {
  if (toggleValue.value !== (event.target as HTMLInputElement).checked) {
    toggleValue.value = (event.target as HTMLInputElement).checked
    emit('change', (event.target as HTMLInputElement).checked)
    emit('input', (event.target as HTMLInputElement).checked)
  }
}
</script>

<style lang="scss" scoped>
$toggleSwitchPadding: var(--kui-space-10, $kui-space-10);

.toggle-switch {
  align-items: center;
  display: inline-flex;
  gap: var(--kui-space-40, $kui-space-40);

  input {
    display: none;
  }

  :deep(label) {
    margin-bottom: var(--kui-space-0, $kui-space-0);
  }

  :not(&.disabled) {
    :deep(label) {
      cursor: pointer;
    }
  }

  .switch-control-wrapper {
    display: flex;

    .switch-control {
      border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
      height: 22px;
      width: 44px;
      background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
      cursor: pointer;
      padding: $toggleSwitchPadding;
      position: relative;
      transition: background-color var(--kui-animation-duration-20, $kui-animation-duration-20) ease;

      &:hover:not(.disabled) {
        background-color: var(--kui-color-background-neutral-weak, $kui-color-background-neutral-weak);

        &::after {
          border: var(--kui-border-width-20, $kui-border-width-20) solid var(--kui-color-border-neutral-weaker, $kui-color-border-neutral-weaker);
        }
      }

      &::before {
        background-color: var(--kui-color-background, $kui-color-background);
        border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
        box-shadow: var(--kui-shadow-border, $kui-shadow-border);
        content: '';
        display: block;
        height: calc(100% - ($toggleSwitchPadding * 2));
        left: $toggleSwitchPadding;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        transition: transform var(--kui-animation-duration-20, $kui-animation-duration-20) ease, box-shadow var(--kui-animation-duration-20, $kui-animation-duration-20) ease;
        width: calc(50% - ($toggleSwitchPadding * 2));
        z-index: 1;
      }

      &:after {
        height: 8px;
        right: calc(25% - 4px);
        width: 8px;
        border: var(--kui-border-width-20, $kui-border-width-20) solid var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak);
        border-radius: var(--kui-border-radius-circle, $kui-border-radius-circle);
        box-sizing: border-box;
        content: '';
        display: block;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        transition: border-color var(--kui-animation-duration-20, $kui-animation-duration-20) ease;
      }

      &-enabled-bar {
        background-color: var(--kui-color-background, $kui-color-background);
        border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
        display: block;
        height: 35%;
        left: 25%;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 2px;
      }

      &.checked {
        background-color: var(--kui-color-background-primary, $kui-color-background-primary);

        &:hover:not(.disabled) {
          background-color: var(--kui-color-background-primary-strong, $kui-color-background-primary-strong);
        }

        &::before {
          box-shadow: 0px 0px 0px var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border-primary-strong, $kui-color-border-primary-strong) inset;
          transform: translateY(-50%) translateX(22px);
        }
      }

      &.disabled {
        background-color: var(--kui-color-background-disabled, $kui-color-background-disabled);
        cursor: not-allowed;

        &::before {
          background-color: var(--kui-color-background-disabled, $kui-color-background-disabled);
          box-shadow: 0px 0px 0px var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak) inset;
        }

        .switch-control-enabled-bar {
          background-color: var(--kui-color-background-neutral-weak, $kui-color-background-neutral-weak);
        }
      }
    }
  }

  &.disabled {
    :deep(label) {
      cursor: not-allowed;
    }
  }
}
</style>
