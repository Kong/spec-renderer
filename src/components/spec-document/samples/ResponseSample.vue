<template>
  <SchemaExample
    class="response-sample"
    :schema-example-json="activeResponseSample"
  >
    <div class="response-sample-header-left">
      <ResponseCodeDot
        :response-code="getResponseCodeKey(responseCode)"
        size="large"
      />
      {{ responseCode }}
    </div>
    <div class="response-sample-header-right">
      <span class="content-type-label">{{ contentType }}</span>
      <SelectDropdown
        v-if="exampleSelectList && exampleSelectList.length > 1"
        id="response-sample-select"
        v-model="activeResponseSampleIndex"
        class="response-sample-selector"
        :items="exampleSelectList"
        placement="bottom-end"
      />
      <CopyButton
        :content="activeResponseSample"
      />
    </div>
  </SchemaExample>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import type { IMediaTypeContent } from '@stoplight/types'
import { getResponseCodeKey, getSampleBody } from '@/utils'
import SchemaExample from '@/components/common/SchemaExample.vue'
import ResponseCodeDot from '@/components/common/ResponseCodeDot.vue'
import CopyButton from '@/components/common/CopyButton.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import type { SelectItem } from '@/types'

const props = defineProps({
  contentList:{
    type: Array as PropType<Array<IMediaTypeContent>>,
    required: true,
  },
  responseCode: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
})

const activeResponseSampleIndex = ref('0')
const activeResponseSample = computed(() => {
  if (props.contentList.length) {
    return getSampleBody(
      props.contentList,
      {},
      parseInt(activeResponseSampleIndex.value) || 0,
    )
  }
  return ''
})
const exampleSelectList = computed((): Array<SelectItem> => {
  if (props.contentList[0]?.examples) {
    return props.contentList[0].examples.map((s, index) => {
      return {
        label: s.key,
        value: index.toString(),
        key: s.key,
      }
    })
  }
  return []
})
</script>

<style lang="scss" scoped>
.response-sample {
  .response-sample-header-left {
    align-items: center;
    display: inline-flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, kui-font-weight-semibold);
    gap: var(--kui-space-40, $kui-space-40);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
  }
  .response-sample-header-right {
    align-items: center;
    display: inline-flex;
    gap: var(--kui-space-50, $kui-space-50);
    .content-type-label {
      border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
      color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
      font-family: var(--kui-font-family-code, $kui-font-family-code);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
      line-height: var(--kui-line-height-20, $kui-line-height-20);
      padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
    }
    .response-sample-selector {
      line-height: var(--kui-line-height-30, $kui-line-height-30);
      :deep(.trigger-button) {
        @include small-bordered-trigger-button;
      }
    }
  }
}
</style>
