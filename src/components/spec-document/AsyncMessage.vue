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
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import type { SchemaModelPropertyField, SchemaObject, AsyncMessageObject } from '@/types'
import ModelNode from './schema-model/ModelNode.vue'
import PageHeader from '../common/PageHeader.vue'
import SchemaExample from '../common/SchemaExample.vue'
import PropertyFieldList from './schema-model/PropertyFieldList.vue'
import { crawl } from '@/utils'
import { CODE_INDENT_SPACES } from '@/constants'
import CollapsibleSection from '@/components/spec-document/endpoint/CollapsibleSection.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'


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
const exampleModel = computed(() => {
  const crawledExample = crawl({
    objData: activeSchemaModel.value,
    parentKey: '',
    nestedLevel: 0,
    filteringOptions: { excludeReadonly: false, excludeNotRequired: false },
  })
  return crawledExample && Object.keys(crawledExample).length ? JSON.stringify(crawledExample, null, CODE_INDENT_SPACES) : ''
})

const hiddenFieldList = computed<Array<SchemaModelPropertyField>>(() =>
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
}
</style>
