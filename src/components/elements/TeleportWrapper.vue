<template>
  <div v-if="shouldRender">
    <slot
      v-if="shadowDom"
      name="default"
    />
    <Teleport
      v-else-if="!shadowDom && shouldRender"
      :disabled="disableTeleport"
      :to="teleportSelector"
    >
      <slot name="default" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import useConfigOptions from '@/composables/useConfigOptions'
import useTeleport from '@/composables/useTeleport'

const props = defineProps({
  parentProps: {
    type: Object,
    required: true,
  },
})

const { shadowDom } = useConfigOptions()
const { teleportSelector, disableTeleport, shouldRender } = useTeleport(props.parentProps, shadowDom)
</script>
