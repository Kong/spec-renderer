<template>
  <Popover
    class="select-dropdown"
    close-on-popover-click
    :disabled="disabled"
    :placement="placement"
    :popover-offset="10"
    width="300px"
  >
    <button
      class="trigger-button"
      :disabled="disabled ? true : undefined"
    >
      <slot name="trigger-content">
        <slot :name="`item-content-${selectedItem?.key}`">
          <span>
            {{ selectedItem?.label || triggerButton }}
          </span>
        </slot>
      </slot>
      <ChevronDownIcon class="chevron-icon" />
    </button>
    <template #content>
      <div class="select-items-container">
        <ul>
          <li
            v-for="item in items"
            :key="`${item.key ? item.key : item.value}-item`"
            class="select-item"
          >
            <slot :name="`item-${item.key}`">
              <button @click="selectValue = item.value">
                <slot :name="`item-content-${item.key}`">
                  {{ item.label }}
                </slot>
              </button>
            </slot>
          </li>
        </ul>
      </div>
    </template>
  </Popover>
</template>

<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue'
import Popover from './HeadlessPopover.vue'
import { ChevronDownIcon } from '@kong/icons'
import type { SelectItem } from '@/types'
import type { Placement } from '@floating-ui/vue'
import { PopoverPlacementVariants } from '@/types'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  triggerButton: {
    type: String,
    default: 'Select',
  },
  items: {
    type: Object as PropType<Array<SelectItem>>,
    required: true,
  },
  placement: {
    type: String as PropType<Placement>,
    validator: (value: Placement): boolean => PopoverPlacementVariants.includes(value),
    default: 'bottom-start',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', item: SelectItem): void
}>()

const selectValue = ref<string>(props.modelValue)

const selectedItem = computed((): SelectItem | undefined => {
  return props.items.find((item) => item.value === selectValue.value)
})

watch(() => props.modelValue, (newValue: string) => {
  selectValue.value = newValue
})

watch(selectValue, (newValue: string) => {
  emit('update:modelValue', newValue)

  const selectedItem = props.items.find((item) => item.value === newValue)
  if (selectedItem) {
    emit('change', selectedItem)
  }
})
</script>

<style lang="scss" scoped>
:deep(.popover-trigger-wrapper) {
  display: inline-block;
}

.select-dropdown {
  display: inline-block;

  .trigger-button {
    @include default-button-reset;
    @include dropdown-item-container;

    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    padding: var(--kui-space-30, $kui-space-30) var(--kui-space-40, $kui-space-40);

    .chevron-icon {
      color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong) !important;
      height: var(--kui-icon-size-30, $kui-icon-size-30) !important;
      width: var(--kui-icon-size-30, $kui-icon-size-30) !important;
    }

    &:hover:not(:disabled):not(:focus):not(:active) {
      background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
    }

    &:focus:not(:disabled),
    &:active:not(:disabled) {
      background-color: var(--kui-color-background-neutral-weak, $kui-color-background-neutral-weak);
    }

    &:disabled {
      color: var(--kui-color-text-disabled, $kui-color-text-disabled);
      cursor: not-allowed;
    }
  }

  .select-items-container {
    background-color: var(--kui-color-background, $kui-color-background);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    box-shadow: var(--kui-shadow, $kui-shadow);
    padding: var(--kui-space-10, $kui-space-10) var(--kui-space-0, $kui-space-0);

    ul {
      list-style-type: none;
      margin: var(--kui-space-0, $kui-space-0);
      padding: var(--kui-space-0, $kui-space-0);

      .select-item {
        button,
        :slotted(button),
        :slotted(a) {
          @include default-button-reset;
          @include dropdown-item-container;
          @include dropdown-item;

          text-align: left;
        }

        :slotted(a) {
          width: auto;
        }
      }
    }
  }
}
</style>
