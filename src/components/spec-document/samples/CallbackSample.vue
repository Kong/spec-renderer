<template>
  <div class="callback-sample">
    <div class="callback-sample-header">
      <span class="active-callback-key">{{ callbackKey }}</span> callback sample
    </div>
    <SchemaExample
      v-if="requestSample"
      class="callback-sample-body"
      :schema-example-json="requestSample"
      title="Callback Body"
    />
  </div>
</template>

<script setup lang="ts">
import SchemaExample from '@/components/common/SchemaExample.vue'

defineProps({
  callbackKey: {
    type: String,
    required: true,
  },
  requestSample: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss" scoped>
.callback-sample {
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  height: max-content;
  overflow: hidden;

  .callback-sample-header {
    background: var(--kui-color-background, $kui-color-background);
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
    margin-bottom: var(--kui-space-50, $kui-space-50);
    padding: var(--kui-space-50, $kui-space-50);

    .active-callback-key {
      @include label-badge;
    }
  }

  .callback-sample-body {
    margin: var(--kui-space-50, $kui-space-50);
  }
}
</style>
