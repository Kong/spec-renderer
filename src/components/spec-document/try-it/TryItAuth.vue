<template>
  <CollapsablePanel
    v-if="securitySchemeGroupList?.length && data.path"
    :data-testid="`tryit-auth-${data.id}`"
  >
    <template #header>
      <LockIcon
        :color="KUI_COLOR_TEXT_NEUTRAL"
        :size="20"
      />
      <h3>
        Authentication
      </h3>

      <SelectDropdown
        v-if="securitySchemeGroupSelectItems.length > 1"
        :id="`tryit-scheme-selector-${data.id}`"
        v-model="activeSchemeGroupKey"
        class="scheme-selector"
        :items="securitySchemeGroupSelectItems"
        placement="bottom-end"
        @update:model-value="initializeTokenValues(activeSecuritySchemeList.length)"
      />
    </template>

    <!-- body -->
    <div
      v-for="(scheme, i) in activeSecuritySchemeList"
      :key="scheme.id"
      class="wide"
    >
      <InputLabel :for="`auth-token-input-${getSchemeLabel(scheme)}-${data.id}`">
        {{ getSchemeLabel(scheme) }}
        <Tooltip
          v-if="scheme.description"
          :id="`auth-token-tooltip-${getSchemeLabel(scheme)}-${data.id}`"
          :text="scheme.description"
        />
      </InputLabel>
      <input
        :id="`auth-token-input-${getSchemeLabel(scheme)}-${data.id}`"
        :aria-describedby="`auth-token-tooltip-${getSchemeLabel(scheme)}-${data.id}`"
        autocomplete="off"
        placeholder="App credential"
        type="text"
        :value="tokenValues[i]"
        @input="(event) => handleTokenInput(event, i)"
      >
    </div>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { LockIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import type { IHttpOperation, HttpSecurityScheme } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'
import InputLabel from '@/components/common/InputLabel.vue'
import Tooltip from '@/components/common/TooltipPopover.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import composables from '@/composables'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const {
  tokenValues,
  securitySchemeGroupSelectItems,
  activeSecuritySchemeList,
  activeSchemeGroupKey,
  securitySchemeGroupList,
  handleTokenInput,
  initializeTokenValues,
} = composables.useAuthTokenState()

const getSchemeLabel = (scheme: HttpSecurityScheme, defaultName?: string): string => {
  //@ts-ignore `name` is valid property
  return scheme.name || scheme.bearerFormat || defaultName || 'Access Token'
}
</script>

<style lang="scss" scoped>
.kui-icon {
  margin-right: var(--kui-space-30, $kui-space-30)!important;
}

.scheme-selector {
  margin-left: auto !important;

  :deep(.trigger-button) {
    @include small-bordered-trigger-button;
  }
}

input[type=text] {
  @include input-default;
}
</style>
