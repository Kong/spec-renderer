<template>
  <div
    class="async-message"
    :data-testid="dataTestId"
  >
    <PageHeader
      class="http-model-header"
      :description="data.summary"
      :title="title"
      :type="data.type?.toString()"
    />
    <div
      v-if="data.messageId"
      class="message-prop"
    >
      Message Id: <b>{{ data.messageId }}</b>
    </div>
    <div
      v-if="data.correlationId"
      class="message-prop"
    >
      Correlation Id: <b>{{ data.correlationId }}</b>
    </div>

    <MarkdownRenderer
      v-if="data.description"
      class="message-description"
      data-testid="spec-renderer-async-message-description"
      :markdown="data.description"
    />

    <div class="http-model-content">
      <div>
        <PropertyFieldList
          :hidden-field-list="hiddenFieldList"
          :property="activeSchemaModel"
          :property-name="title"
          :required-fields="activeSchemaModel?.required"
        />
        <CollapsibleSection title="Payload">
          <ModelNode
            :schema="payload"
            :title="title"
            @selected-model-changed="(newModel: SchemaObject) => activeSchemaModel = newModel"
          />
        </CollapsibleSection>
      </div>
      <SchemaExample
        v-if="exampleModel"
        :schema-example-json="exampleModel"
      >
        <template #header-actions>
          <SelectDropdown
            v-if="exampleSelectItems.length > 1"
            id="async-message-example-select"
            data-testid="async-message-example-selector"
            :items="exampleSelectItems"
            :model-value="activeExampleIndex.toString()"
            placement="bottom-end"
            @change="activeExampleIndex = Number($event.value)"
          />
        </template>
      </SchemaExample>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { SchemaModelPropertyField, SchemaObject, AsyncMessageObject, SelectItem } from '@/types'
import ModelNode from './schema-model/ModelNode.vue'
import PageHeader from '../common/PageHeader.vue'
import SchemaExample from '../common/SchemaExample.vue'
import PropertyFieldList from './schema-model/PropertyFieldList.vue'
import { crawl } from '@/utils'
import { CODE_INDENT_SPACES } from '@/constants'
import CollapsibleSection from '@/components/spec-document/endpoint/CollapsibleSection.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'


const props = defineProps({
  data: {
    type: Object as PropType<AsyncMessageObject>,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
})
const dataTestId = computed(() => `http-async-message-${props.title.replaceAll(' ', '-')}`)
const payload = computed(() => props.data.payload ?? {})
const activeSchemaModel = ref<SchemaObject>(payload.value)
const activeExampleIndex = ref<number>(0)
const exampleSelectItems = computed((): SelectItem[] =>
  (props.data.messageExamples ?? []).map((example, index) => ({
    label: example.name || `Example ${index + 1}`,
    value: index.toString(),
    key: `async-message-example-${index}`,
  })),
)
const exampleModel = computed(() => {
  const selectedExample = props.data.messageExamples?.[activeExampleIndex.value]
  if (selectedExample?.payload !== undefined) {
    return JSON.stringify(selectedExample.payload, null, CODE_INDENT_SPACES)
  }

  const crawledExample = crawl({
    objData: activeSchemaModel.value,
    filteringOptions: { excludeReadonly: false, excludeNotRequired: false },
  })
  return crawledExample && Object.keys(crawledExample).length ? JSON.stringify(crawledExample, null, CODE_INDENT_SPACES) : ''
})

watch(() => props.data.messageExamples, () => {
  activeExampleIndex.value = 0
})

const hiddenFieldList = computed<SchemaModelPropertyField[]>(() =>
  exampleModel.value
    ? ['info', 'description', 'example']
    : ['info', 'description'],
)
</script>

<style lang="scss" scoped>
.async-message {
  @include http-model;

  .message-prop {
    padding-bottom: var(--kui-space-40, $kui-space-40);
  }

  .message-description {
    padding-top: var(--kui-space-40, $kui-space-40);
  }

  :deep(.schema-example-header-actions .trigger-button) {
    @include small-bordered-trigger-button;
  }
}
</style>
