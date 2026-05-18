<template>
  <SchemaExample
    class="response-sample"
    data-testid="response-sample"
    :is-resizable="true"
    :schema-example-json="activeResponseSample"
  >
    <slot />
    <div class="response-sample-header-right">
      <button
        v-if="hasMaskedData"
        class="mask-toggle-button"
        :title="showMasked ? 'Show sensitive data' : 'Mask sensitive data'"
        @click="showMasked = !showMasked"
      >
        <component
          :is="showMasked ? VisibilityOffIcon : VisibilityIcon"
          size="16px"
        />
      </button>
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
import { VisibilityIcon, VisibilityOffIcon } from '@kong/icons'
import type { SelectItem } from '@/types'

const props = defineProps({
  contentList: {
    type: Array as PropType<IMediaTypeContent[]>,
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
const showMasked = ref<boolean>(true)

const activeResponseSample = computed(() => {
  if (props.contentList.length) {
    return getSampleBody(
      props.contentList,
      {},
      parseInt(activeResponseSampleIndex.value) || 0,
      !showMasked.value,
    )
  }

  // if content list is empty, we fallback to show the description
  return props.description
})

// Only show toggle when masking actually changes the output
const hasMaskedData = computed(() => {
  if (!props.contentList.length) return false
  const idx = parseInt(activeResponseSampleIndex.value) || 0
  return getSampleBody(props.contentList, {}, idx, false) !== getSampleBody(props.contentList, {}, idx, true)
})

const exampleSelectList = computed((): SelectItem[] => {
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

    .mask-toggle-button {
      @include default-button-reset;
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);

      &:hover {
        color: var(--kui-color-text, $kui-color-text);
      }
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
