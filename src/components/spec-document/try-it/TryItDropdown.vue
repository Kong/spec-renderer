<template>
  <SelectDropdown
    class="tryit-dropdown"
    :class="`${data.method}`"
    :data-testid="`tryit-dropdown-${data.id}`"
    :items="items"
    placement="bottom-end"
    trigger-button="Try It"
  >
    <template #browser-item="{ item }">
      <button
        data-testid="tryit-send-request"
        @click="startApiCall"
      >
        <NetworkIcon />
        {{ item.label }}
      </button>
    </template>
    <template #insomnia-item="{ item }">
      <button data-testid="tryit-insomnia">
        <InsomniaIcon />
        {{ item.label }}
      </button>
    </template>
  </SelectDropdown>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
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

const startApiCall = () => {
  emit('tryit-api-call')
}
</script>

<style lang="scss" scoped>
@mixin method-appearance(
  $methodColor: var(--kui-color-border, $kui-color-border),
  $hoverBg: var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest),
) {
  :deep(.trigger-button) {
    border-color: $methodColor;
    color: $methodColor;

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

.tryit-dropdown {
  :deep(.trigger-button) {
    border-color: var(--kui-color-border, $kui-color-border);
    border-width: var(--kui-border-width-20, $kui-border-width-20);
    border-style: solid;
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    padding-top: var(--kui-space-20, $kui-space-20);
    padding-bottom: var(--kui-space-20, $kui-space-20);
    white-space: nowrap;
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
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
}
</style>
