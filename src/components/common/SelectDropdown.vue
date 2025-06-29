<template>
  <Popover
    ref="selectPopoverRef"
    :aria-activedescendant="selectedItem ? `${selectedItem.key ? selectedItem.key : selectedItem.value}-item` : undefined"
    :aria-labelledby="attrs.id ? String(attrs.id) : undefined"
    class="select-dropdown"
    close-on-popover-click
    data-testid="select-dropdown"
    :disabled="disabled"
    :placement="placement"
    :popover-offset="popoverOffset"
    width="300px"
    v-bind="sanitizedAttrs"
  >
    <button
      :aria-label="selectedItem?.label || triggerButton ? undefined : 'Select one option'"
      class="trigger-button"
      data-select-dropdown-trigger="true"
      data-testid="trigger-button"
      :disabled="disabled ? true : undefined"
      type="button"
      v-bind="attrs.id ? { id: String(attrs.id) } : {}"
    >
      <slot name="trigger-content">
        <slot
          :item="selectedItem"
          :name="`${selectedItem?.key}-item-content`"
        >
          <span v-if="selectedItem?.label || triggerButton">
            {{ selectedItem?.label || triggerButton }}
          </span>
        </slot>
      </slot>
      <ChevronDownIcon
        class="select-chevron-icon"
        decorative
      />
    </button>
    <template #content>
      <div class="select-items-container">
        <ul>
          <li
            v-for="item in items"
            :id="`${item.key ? item.key : item.value}-item`"
            :key="`${item.key ? item.key : item.value}-item`"
            :aria-selected="item.value === selectValue ? 'true' : 'false'"
            class="select-item"
            :class="{ 'selected': item.value === selectValue }"
            :data-testid="item.key ? `${item.key}-item` : 'select-item'"
            role="option"
          >
            <slot
              :item="item"
              :name="`${item.key}-item`"
            >
              <button
                :data-testid="item.key ? `${item.key}-item-trigger` : 'select-item-trigger'"
                @click.stop="selectItem(item.value)"
              >
                <slot
                  :item="item"
                  :name="`${item.key}-item-content`"
                >
                  <span>{{ item.label }}</span>
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
defineOptions({
  inheritAttrs: false,
})

import { computed, useAttrs, watch } from 'vue'
import type { PropType } from 'vue'
import Popover from './HeadlessPopover.vue'
import { ChevronDownIcon } from '@kong/icons'
import type { SelectItem } from '@/types'
import type { Placement } from '@floating-ui/vue'
import { PopoverPlacementVariants } from '@/types'
import { ref } from 'vue'

const props = defineProps({
  triggerButton: {
    type: String,
    default: 'Select',
  },
  items: {
    type: Object as PropType<SelectItem[]>,
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
  popoverOffset: {
    type: Number,
    default: 10,
  },
})

const emit = defineEmits<{
  (e: 'change', item: SelectItem): void
}>()

const attrs = useAttrs()

/**
 * Remove id from attrs because we bind them to the trigger button.
 */
const sanitizedAttrs = computed(() => {
  const strippedAttrs = { ...attrs }

  delete strippedAttrs.id

  return strippedAttrs
})

const selectValue = defineModel<string>({ default: '' })

const selectPopoverRef = ref<InstanceType<typeof Popover> | null>(null)

const selectItem = (value: string) => {
  selectValue.value = value

  selectPopoverRef.value?.hidePopover()
}

const selectedItem = computed((): SelectItem | undefined => {
  return props.items.find((item) => item.value === selectValue.value)
})

watch(selectValue, (newValue: string) => {
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

    // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
    // stylelint-disable-next-line no-duplicate-selectors
    & {
      @include dropdown-item-container;
    }

    // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
    // stylelint-disable-next-line no-duplicate-selectors
    & {
      border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
      padding: var(--kui-space-30, $kui-space-30) var(--kui-space-40, $kui-space-40);
    }

    * {
      pointer-events: none; // disable pointer events on children to make sure the button is the only clickable element
    }

    .select-chevron-icon {
      flex-shrink: 0;
      height: var(--kui-icon-size-30, $kui-icon-size-30) !important;
      width: var(--kui-icon-size-30, $kui-icon-size-30) !important;
    }

    &:hover:not(:disabled):not(:focus):not(:active) {
      background-color: var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest);
      color: var(--kui-color-text-primary-stronger, $kui-color-text-primary-stronger);
    }

    &:focus:not(:disabled),
    &:active:not(:disabled) {
      background-color: var(--kui-color-background-primary-weaker, $kui-color-background-primary-weaker);
      color: var(--kui-color-text-primary-stronger, $kui-color-text-primary-stronger);
    }

    &:disabled {
      color: var(--kui-color-text-disabled, $kui-color-text-disabled);
      cursor: not-allowed;

      .select-chevron-icon {
        color: var(--kui-color-text-disabled, $kui-color-text-disabled) !important;
      }
    }
  }

  .select-items-container {
    background-color: var(--kui-color-background, $kui-color-background);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
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

          // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
          // stylelint-disable-next-line no-duplicate-selectors
          & {
            @include dropdown-item-container;
          }

          // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
          // stylelint-disable-next-line no-duplicate-selectors
          & {
            @include dropdown-item;
          }

          // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
          // stylelint-disable-next-line no-duplicate-selectors
          & {
            text-align: left;
          }
        }

        :slotted(a) {
          width: auto;
        }

        &.selected {
          background-color: var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest);

          button,
          :slotted(button),
          :slotted(a) {
            color: var(--kui-color-text-primary-stronger, $kui-color-text-primary-stronger);
          }
        }
      }
    }
  }
}
</style>
