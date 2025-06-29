<template>
  <SchemaExample
    class="response-sample"
    data-testid="response-sample"
    :schema-example-json="activeResponseSample"
  >
    <slot />
    <div class="response-sample-header-right">
      <SelectDropdown
        v-if="exampleSelectList && exampleSelectList.length > 1"
        id="response-sample-select"
        v-model="activeResponseSampleIndex"
        class="response-sample-selector"
        data-testid="response-sample-selector"
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
import { getSampleBody } from '@/utils'
import SchemaExample from '@/components/common/SchemaExample.vue'
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
  description: {
    type: String,
    default: '',
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

  // if content list is empty, we fallback to show the description
  return props.description
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
  .response-sample-header-right {
    align-items: center;
    display: inline-flex;
    gap: var(--kui-space-50, $kui-space-50);

    .response-sample-selector {
      line-height: var(--kui-line-height-30, $kui-line-height-30);

      :deep(.trigger-button) {
        @include small-bordered-trigger-button;
      }
    }
  }
}
</style>
