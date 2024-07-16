<template>
  <SchemaExample
    class="response-sample"
    :schema-example-json="responseSample"
  >
    <template #header-left>
      <div class="response-sample-code">
        <ResponseCodeDot
          :response-code="getResponseCodeKey(responseCode)"
          size="large"
        />
        {{ responseCode }}
      </div>
    </template>
  </SchemaExample>
</template>

<script setup lang="ts">
import { getResponseCodeKey } from '@/utils'
import SchemaExample from '@/components/common/SchemaExample.vue'
import ResponseCodeDot from '@/components/common/ResponseCodeDot.vue'

defineProps({
  responseSample: {
    type: String,
    required: true,
  },
  responseCode: {
    type: String,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.response-sample {
  .response-sample-code {
    align-items: center;
    display: inline-flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, kui-font-weight-semibold);
    gap: var(--kui-space-40, $kui-space-40);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
  }
}
</style>
