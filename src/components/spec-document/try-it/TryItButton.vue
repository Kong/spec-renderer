<template>
  <button
    class="tryit-btn"
    :data-testid="`tryit-btn-${data.id}`"
    @click="startApiCall"
  >
    Try It!
  </button>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'tryit-api-call'): void,
}>()

const startApiCall = () => {
  emit('tryit-api-call')
}
</script>

<style lang="scss" scoped>
.tryit-btn {
  border: $kui-border-width-10 solid $kui-color-border;
}
</style>
