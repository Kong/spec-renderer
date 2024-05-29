<template>
  <div
    class="tryit-wrapper"
    :data-testid="`tryit-wrapper-${data.id}`"
  >
    <TryItAuth
      v-if="showTryItPanel"
      :data="data"
    />
    <TryItRequest
      :data="data"
    />
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref } from 'vue'
import type { PropType, Ref } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import TryItAuth from './TryItAuth.vue'
import TryItRequest from './TryItRequest.vue'

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

<style lang="scss" scoped>
:deep(.tryit-card) {
  border: 1px solid $kui-color-border;
  border-radius: $kui-border-radius-30;

  .tryit-card-header {
      background-color: $kui-color-background;
      display: flex;
      padding: 10px;

      h5 {
        color: $kui-color-text;
        margin: 0 0 0 $kui-space-30;
        padding: 0;
      }
    }

    .tryit-card-body {
      background-color: $kui-color-background-neutral-weakest;
      border-top: 1px solid $kui-color-border;
      width: 100%;
    }

    @media (max-width: $kui-breakpoint-mobile) {
      .tryit-card-body {
        grid-template-columns: 1fr;
      }
    }
}
</style>
