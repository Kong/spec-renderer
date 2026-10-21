<template>
  <ToggleSwitch
    :id="`auth-toggle-oauth2-authorizationCode-manual-${dataId}`"
    class="manual-toggle"
    :data-testid="`tryit-auth-manual-toggle-${dataId}`"
    label="Use access token"
    label-position="start"
    :model-value="model"
    size="small"
    @update:model-value="setManual(schemeKey, $event)"
  />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import ToggleSwitch from '@/components/common/ToggleSwitch.vue'
import composables from '@/composables'

const { schemeKey, dataId } = defineProps<{
  schemeKey: string
  dataId: string
}>()

const model = defineModel<boolean>({ default: false })

const { isManual, setManual } = composables.useOAuthPkce()

// mode could have been mutated by other components, so keep the local model in sync
watch(() => isManual(schemeKey), (value) => {
  model.value = value
}, { immediate: true })
</script>

<style lang="scss" scoped>
.panel-body {
  .manual-toggle {
    justify-content: right;
    margin-bottom: var(--kui-space-40, $kui-space-40);
    width: 100%;
  }
}
</style>
