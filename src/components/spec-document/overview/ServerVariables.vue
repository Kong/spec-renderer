<template>
  <div
    v-if="server.variables"
    class="variables-container"
  >
    <span class="variables-label">Variables</span>
    <div
      v-for="key in Object.keys(server.variables)"
      :key="`${server.id}-${key}`"
      class="variable-container"
    >
      {{ key }}:
      <SelectDropdown
        v-if="server.variables[key].enum"
        :data-testid="`${server.id}-${key}-select`"
        :items="enumToSelectItem(server.variables[key].enum)"
        :model-value="server.variables[key].extensions?.value as string || server.variables[key].default"
        @change="(item) => handleVariableChange(server.id, key, item.value)"
      />
      <input
        v-else
        :data-testid="`${server.id}-${key}-input`"
        type="text"
        :value="server.variables[key].extensions?.value || server.variables[key].default"
        @change="(e) => handleVariableChange(server.id, key, (e.target as HTMLInputElement).value)"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IServer } from '@/types'
import type { PropType } from 'vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import type { SelectItem } from '@/types'


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
  padding: var(--kui-space-60, $kui-space-60) 0;

  .variables-label {
    margin-right: var(--kui-space-40, $kui-space-40);
  }
  .variable-container {
    padding: var(--kui-space-20, $kui-space-20);
    margin: var(--kui-space-20, $kui-space-20);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    display: inline;
    white-space: nowrap;

    input {
      border: none;
      field-sizing: content;
    }
    :deep(.trigger-button) {
      @include small-bordered-trigger-button;
      & {
        border: none;
      }
      @media (min-width: $kui-breakpoint-mobile) {
        padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
      }
    }

  }
}
</style>
