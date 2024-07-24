<template>
  <button
    class="call-button"
    :class="[data.method, { 'unhover': isHoveringDropdown, 'no-dropdown': !showInsomnia }]"
    :data-testid="`tryit-call-button-${data.id}`"
    @click="startApiCall"
  >
    <component
      :is="selectedTryItMethodKey === 'browser' ? NetworkIcon : InsomniaIcon"
      v-if="showInsomnia"
      class="tryit-method-icon"
    />
    Try It!

    <SelectDropdown
      v-cloak
      v-if="showInsomnia"
      :id="`tryit-dropdown-${data.id}`"
      class="tryit-dropdown"
      :data-testid="`tryit-dropdown-${data.id}`"
      :items="items"
      placement="bottom-end"
      :popover-offset="15"
      trigger-button=""
      @mouseenter="isHoveringDropdown = true"
      @mouseleave="isHoveringDropdown = false"
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
  </button>
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
const isHoveringDropdown = ref<boolean>(false)

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
@mixin method-appearance(
  $methodColor: var(--kui-color-border, $kui-color-border),
  $hoverBg: var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest),
) {
  border-color: $methodColor;
  color: $methodColor;

  &:hover,
  &:focus,
  &:active {
    background-color: $hoverBg;
  }

  .tryit-dropdown :deep(.trigger-button) {
    .select-chevron-icon {
      color: $methodColor !important;
    }

    &:hover,
    &:focus,
    &:active {
      background-color: $hoverBg !important;
      color: $methodColor !important;
    }
  }
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

  &.unhover {
    &:hover {
      background-color: var(--kui-color-background, $kui-color-background) !important;
    }
  }

  &.no-dropdown {
    padding-left: var(--kui-space-40, $kui-space-40);
    padding-right: var(--kui-space-40, $kui-space-40);
  }

  .tryit-method-icon {
    width: var(--kui-icon-size-40, $kui-icon-size-40) !important;
  }

  &.get {
    @include method-appearance(
      var(--kui-method-color-text-get, $kui-method-color-text-get),
      var(--kui-method-color-background-get, $kui-method-color-background-get),
    )
  }

  &.post {
    @include method-appearance(
      var(--kui-method-color-text-post, $kui-method-color-text-post),
      var(--kui-method-color-background-post, $kui-method-color-background-post),
    )
  }

  &.put {
    @include method-appearance(
      var(--kui-method-color-text-put, $kui-method-color-text-put),
      var(--kui-method-color-background-put, $kui-method-color-background-put),
    )
  }

  &.delete {
    @include method-appearance(
      var(--kui-method-color-text-delete, $kui-method-color-text-delete),
      var(--kui-method-color-background-delete, $kui-method-color-background-delete),
    )
  }

  &.patch {
    @include method-appearance(
      var(--kui-method-color-text-patch, $kui-method-color-text-patch),
      var(--kui-method-color-background-patch, $kui-method-color-background-patch),
    )
  }

  &.options {
    @include method-appearance(
      var(--kui-method-color-text-options, $kui-method-color-text-options),
      var(--kui-method-color-background-options, $kui-method-color-background-options),
    )
  }

  &.head {
    @include method-appearance(
      var(--kui-method-color-text-head, $kui-method-color-text-head),
      var(--kui-method-color-background-head, $kui-method-color-background-head),
    )
  }

  &.connect {
    @include method-appearance(
      var(--kui-method-color-text-connect, $kui-method-color-text-connect),
      var(--kui-method-color-background-connect, $kui-method-color-background-connect),
    )
  }

  &.trace {
    @include method-appearance(
      var(--kui-method-color-text-trace, $kui-method-color-text-trace),
      var(--kui-method-color-background-trace, $kui-method-color-background-trace),
    )
  }

  .tryit-dropdown {
    display: flex;

    :deep(.trigger-button) {
      padding: var(--kui-space-10, $kui-space-10);
    }
  }
}
</style>
