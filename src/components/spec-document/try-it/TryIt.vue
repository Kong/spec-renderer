<template>
  <div
    class="tryit-card"
    :data-testid="`tryit-${data.id}`"
  >
    <div class="tryit-card-header">
      <LockIcon
        :color="KUI_COLOR_TEXT_NEUTRAL"
        :size="20"
      />
      <h5>Authentication</h5>
      <button class="tryit-btn">
        Try It!
      </button>
    </div>
    <div class="tryit-card-body">
      <div class="left">
        <label>Method</label>
        <select>
          <option
            v-for="sec in overviewData.securitySchemes"
            :key="sec.id"
          >
            {{ sec.key }} ({{ sec.type }})
          </option>
        </select>
      </div>
      <div class="right">
        <label>Access Token</label>
        <input placeholder="App credential">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpOperation, IHttpService } from '@stoplight/types'
import { LockIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'

defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
  overviewData: {
    type: Object as PropType<IHttpService>,
    required: true,
  },
})
</script>

<style lang="scss" scoped>

.tryit-card {
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
    .tryit-btn {
      margin-left: auto;
    }
  }
  .tryit-card-body {
    background-color: $kui-color-background-neutral-weakest;
    border-top: 1px solid $kui-color-border;
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    .left, .right {
      display: flex;
      flex-direction: column;
      margin: $kui-space-50 $kui-space-40;
    }
    input, select {
      box-sizing:border-box;
      border: 1px solid $kui-color-border;
      border-radius: $kui-border-radius-30;
      padding: $kui-space-40 $kui-space-50;
    }
    label {
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-medium;
      line-height: $kui-line-height-30;
    }
  }
  @media (max-width: $kui-breakpoint-mobile) {
    .tryit-card-body {
      grid-template-columns: 1fr;
    }
  }
}
</style>
