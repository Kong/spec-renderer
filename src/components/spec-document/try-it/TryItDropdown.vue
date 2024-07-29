<template>
  <div class="tryit-wrapper">
    <button
      class="call-button"
      :class="{ 'no-dropdown': !showInsomnia }"
      :data-testid="`tryit-call-button-${data.id}`"
      @click="startApiCall"
    >
      <component
        :is="selectedTryItMethodKey === 'browser' ? NetworkIcon : InsomniaIcon"
        v-if="showInsomnia"
        class="tryit-method-icon"
      />
      Try It!
    </button>

    <SelectDropdown
      v-if="showInsomnia"
      :id="`tryit-dropdown-${data.id}`"
      class="tryit-dropdown"
      :data-testid="`tryit-dropdown-${data.id}`"
      :items="items"
      placement="bottom-end"
      trigger-button=""
    >
      <template #browser-item="{ item }">
        <button
          :data-testid="`tryit-send-request-${data.id}`"
          @click="selectionChanged(item)"
        >
          <NetworkIcon />
          {{ item.label }}
        </button>
      </template>
      <template #insomnia-item="{ item }">
        <button
          :data-testid="`tryit-insomnia-${data.id}`"
          @click=" selectionChanged(item)"
        >
          <InsomniaIcon />
          {{ item.label }}
        </button>
      </template>
    </SelectDropdown>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import type { PropType, Ref } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import type { SelectItem } from '@/types'
import { NetworkIcon, InsomniaIcon } from '@kong/icons'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'tryit-api-call'): void,
}>()

const items: Array<SelectItem> = [
  {
    label: 'in Browser',
    value: 'browser',
    key: 'browser',
  },
  {
    label: 'in Insomnia',
    value: 'insomnia',
    key: 'insomnia',
  },
]


const hideInsomniaTryIt = inject<Ref<boolean>>('hide-insomnia-tryit', ref(false))
const specUrl = inject<Ref<string>>('spec-url', ref(''))

// when property forced or url of the specification is not provided
const showInsomnia = computed((): boolean => {
  return !(hideInsomniaTryIt.value || !specUrl.value)
})

const selectedTryItMethodKey = ref<string>('browser')

const startApiCall = (event?: Event) => {
  if (!event || !(event.target as HTMLElement).dataset.selectDropdownTrigger) {
    if (selectedTryItMethodKey.value === 'browser') {
      emit('tryit-api-call')
    } else {
      window.open(
        `https://insomnia.rest/run?uri=${encodeURIComponent(specUrl.value)}`, '_blank')
    }
  }
}

const selectionChanged = (item: SelectItem) => {
  selectedTryItMethodKey.value = item.key || 'browser'
  startApiCall()
}
</script>

<style lang="scss" scoped>
@mixin tryit-button-appearance {
  .call-button {
    border-color: var(--kui-color-border-primary, $kui-color-border-primary);
    color: var(--kui-color-text-primary, $kui-color-text-primary);

    &:hover,
    &:focus,
    &:active {
      background-color: var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest);
    }
  }

  .tryit-dropdown {
    :deep(.trigger-button) {
      border-color: var(--kui-color-border-primary, $kui-color-border-primary);

      .select-chevron-icon {
        color: var(--kui-color-text-primary, $kui-color-text-primary) !important;
      }

      &:hover,
      &:focus,
      &:active {
        background-color: var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest) !important;
        color: var(--kui-color-text-primary, $kui-color-text-primary) !important;
      }
    }
  }
}

.tryit-wrapper {
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);

  @media (min-width: $kui-breakpoint-mobile) {
    gap: var(--kui-space-0, $kui-space-0);
  }

  @include tryit-button-appearance;
}

.call-button {
  @include default-button-reset;

  align-items: center;
  background-color: var(--kui-color-background, $kui-color-background);
  border-color: var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  border-style: solid;
  border-width: var(--kui-border-width-20, $kui-border-width-20);
  display: flex;
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  gap: var(--kui-space-30, $kui-space-30);
  justify-content: center;
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  padding: var(--kui-space-20, $kui-space-20) var(--kui-space-30, $kui-space-30);
  white-space: nowrap;
  width: 100%;

  @media (min-width: $kui-breakpoint-mobile) {
    border-bottom-right-radius: var(--kui-border-radius-0, $kui-border-radius-0);
    border-right-width: var(--kui-border-width-0, $kui-border-width-0);
    border-top-right-radius: var(--kui-border-radius-0, $kui-border-radius-0);
  }

  &.no-dropdown {
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    border-right-width: var(--kui-border-width-20, $kui-border-width-20);
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
  }

  .tryit-method-icon {
    width: var(--kui-icon-size-40, $kui-icon-size-40) !important;
  }
}

.tryit-dropdown {
  display: flex;

  :deep(.trigger-button) {
    border-color: var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    border-style: solid;
    border-width: var(--kui-border-width-20, $kui-border-width-20);
    height: 100%;
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-30, $kui-space-30);

    @media (min-width: $kui-breakpoint-mobile) {
      border-bottom-left-radius: var(--kui-border-radius-0, $kui-border-radius-0);
      border-left-width: var(--kui-border-width-0, $kui-border-width-0);
      border-top-left-radius: var(--kui-border-radius-0, $kui-border-radius-0);
      padding: var(--kui-space-20, $kui-space-20) var(--kui-space-30, $kui-space-30) var(--kui-space-20, $kui-space-20) var(--kui-space-20, $kui-space-20);
    }
  }
}
</style>
