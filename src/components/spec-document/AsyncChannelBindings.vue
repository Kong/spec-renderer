<template>
  <CollapsibleSection
    v-if="hasBindings"
    :border-visible="false"
    class="async-channel-bindings"
  >
    <template #title>
      <div class="channel-bindings-title">
        <h3>Channel Bindings</h3>
        <SelectDropdown
          v-if="protocols.length > 1"
          v-model="selectedProtocol"
          class="protocol-selector"
          data-testid="channel-bindings-protocol-selector"
          :items="protocolSelectItems"
        >
          <template #trigger-content>
            <span class="protocol-label">{{ selectedProtocol.toUpperCase() }}</span>
          </template>
        </SelectDropdown>
        <LabelBadge
          v-else
          :label="selectedProtocol.toUpperCase()"
          size="small"
          type="neutral"
        />
      </div>
    </template>

    <div class="channel-bindings-content">
      <AsyncBindingPropertyRow
        v-for="[key, val] in bindingEntries"
        :key="key"
        :prop-key="key"
        :value="val"
      />
    </div>
  </CollapsibleSection>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { ChannelInterface } from '@asyncapi/parser'
import CollapsibleSection from './endpoint/CollapsibleSection.vue'
import LabelBadge from '@/components/common/LabelBadge.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import AsyncBindingPropertyRow from './AsyncBindingPropertyRow.vue'

const props = defineProps({
  channel: {
    type: Object as PropType<ChannelInterface>,
    required: true,
  },
})

const bindings = computed(() => props.channel.bindings().all())
const hasBindings = computed(() => bindings.value.length > 0)
const protocols = computed(() => bindings.value.map(b => b.protocol()))

const selectedProtocol = ref<string>(protocols.value[0] ?? '')

watch(protocols, (newProtocols) => {
  if (!newProtocols.includes(selectedProtocol.value)) {
    selectedProtocol.value = newProtocols[0] ?? ''
  }
})

const protocolSelectItems = computed(() =>
  protocols.value.map(p => ({ label: p.toUpperCase(), value: p, key: p })),
)

const currentBindingValue = computed((): Record<string, any> => {
  const binding = bindings.value.find(b => b.protocol() === selectedProtocol.value)
  return binding?.value<Record<string, any>>() ?? {}
})

// All binding entries except the bindingVersion metadata key
const bindingEntries = computed((): Array<[string, any]> =>
  Object.entries(currentBindingValue.value).filter(([k]) => k !== 'bindingVersion'),
)
</script>

<style lang="scss" scoped>
.async-channel-bindings {
  .channel-bindings-title {
    align-items: center;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);

    h3 {
      margin: var(--kui-space-0, $kui-space-0);
    }
  }

  .protocol-selector {
    :deep(.trigger-button) {
      background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
      color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      line-height: var(--kui-line-height-20, $kui-line-height-20);
      padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
    }
  }

  .channel-bindings-content {
    background: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    margin-top: var(--kui-space-20, $kui-space-20);
    padding: var(--kui-space-50, $kui-space-50);
  }
}
</style>
