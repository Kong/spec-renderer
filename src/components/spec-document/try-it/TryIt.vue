<template>
  <div
    class="tryit-wrapper"
    :data-testid="`tryit-wrapper-${data.id}`"
  >
    <TryItAuth
      v-if="showTryItPanel"
      :data="data"
    />
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref } from 'vue'
import type { PropType, Ref } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import TryItAuth from './TryItAuth.vue'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

// this is tryout state requested by property passed
const hideTryIt = inject<Ref<boolean>>('hide-tryit', ref(false))

// there is more logic that drives do we show tryouts or not
const showTryItPanel = computed((): boolean => {
  // if there are no services defined in overView we do not show tryIt
  return !hideTryIt.value && Array.isArray(props.data.servers) && props.data.servers.length > 0
})

</script>

