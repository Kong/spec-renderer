<template>
  <CollapsablePanel
    :data-testid="`tryit-params-${data.id}`"
  >
    <template #header>
      <h5>
        Parameters
      </h5>
    </template>
  </CollapsablePanel>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import CollapsablePanel from '@/components/common/CollapsablePanel.vue'


/**
 * This components handles path parameters, query parameters and body.
 * only parts of
 */
defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'request-params-changed'): void
}>()

</script>

