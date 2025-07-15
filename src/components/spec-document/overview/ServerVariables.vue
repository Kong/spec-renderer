<template>
  <div
    v-if="server.variables"
    class="variables-container"
  >
    <span class="variables-label">Variables</span>
    <div
      v-for="(value, key) in server.variables"
      :key="`${server.id}-${key}`"
      class="variable-container"
    >
      {{ key }}:
      <SelectDropdown
        v-if="value.enum"
        :data-testid="`${server.id}-${key}-select`"
        :items="enumToSelectItem(value.enum)"
        :model-value="value.extensions?.value as string || value.default"
        @change="(item) => handleVariableChange(server.id, key, item.value)"
      />
      <input
        v-else
        :data-testid="`${server.id}-${key}-input`"
        type="text"
        :value="value.extensions?.value || value.default"
        @change="(e) => handleVariableChange(server.id, key, (e.target as HTMLInputElement).value)"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IServer, SelectItem } from '@/types'
import type { PropType } from 'vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'


defineProps({
  server: {
    type: Object as PropType<IServer>,
    required: true,
  },
})

const enumToSelectItem = (enumValues: string[] | undefined): SelectItem[] => {

  return (enumValues || []).map((v:string) => ({ label: v, value: v }))
}

const emit = defineEmits<{
  (e: 'set-server-variable', serverId: string, variableKey: string, variableValue: string): void
}>()


const handleVariableChange = (serverId: string, variableKey: string, variableValue: string) => {
  emit('set-server-variable', serverId, variableKey, variableValue)
}

</script>

<style lang="scss" scoped>
.variables-container {
  @include model-property-additional-field;

  padding: var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0);

  .variables-label {
    margin-right: var(--kui-space-40, $kui-space-40);
  }

  .variable-container {
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    display: inline;
    margin: var(--kui-space-20, $kui-space-20) var(--kui-space-30, $kui-space-30);
    padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
    white-space: nowrap;

    input {
      border: none;
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      field-sizing: content;
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
      line-height: var(--kui-line-height-20, $kui-line-height-20);

      &:focus {
        outline: none;
      }
    }


    :deep(.trigger-button) {
      @include small-bordered-trigger-button;

      // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
      // stylelint-disable-next-line no-duplicate-selectors
      & {
        border: none;
        color: var(--kui-color-text-neutral, $kui-color-text-neutral);
        font-size: var(--kui-font-size-20, $kui-font-size-20);
        font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
        line-height: var(--kui-line-height-20, $kui-line-height-20);
        padding-right: var(--kui-space-0, $kui-space-0)!important;
      }
      @media (min-width: $kui-breakpoint-mobile) {
        padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
      }
    }

  }
}
</style>
