<template>
  <div
    class="http-model"
    :data-testid="dataTestId"
  >
    <PageHeader
      class="http-model-header"
      :description="data.description"
      :title="title"
    />

    <div class="http-model-content">
      <ModelNode
        :schema="resolvedSchemaObject"
        :title="title"
      />
      <div
        v-if="exampleModel"
        class="http-model-example-container"
      >
        <div class="http-model-example-header">
          <span>Example</span>
          <CopyButton
            :content="exampleModel"
          />
        </div>
        <CodeBlock
          class="http-model-example-content"
          :code="exampleModel"
          lang="json"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'
import ModelNode from './schema-model/ModelNode.vue'
import PageHeader from '../common/PageHeader.vue'
import CodeBlock from '../common/CodeBlock.vue'
import CopyButton from '../common/CopyButton.vue'
import { crawl, resolveSchemaObjectFields } from '@/utils'

const props = defineProps({
  data: {
    type: Object as PropType<SchemaObject>,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
})

const dataTestId = computed(() => `http-model-${props.title.replaceAll(' ', '-')}`)
const resolvedSchemaObject = computed(() => resolveSchemaObjectFields(props.data))
const exampleModel = computed(() => {
  const crawledExample = crawl({
    objData: resolvedSchemaObject.value,
    parentKey: '',
    nestedLevel: 0,
    filteringOptions: { excludeReadonly: false, excludeNotRequired: false },
  })
  return crawledExample && Object.keys(crawledExample).length ? JSON.stringify(crawledExample, null, 2) : ''
})
</script>

<style lang="scss" scoped>
.http-model {
  * {
    margin: var(--kui-space-0, $kui-space-0);
  }

  .http-model-header {
    margin-bottom: var(--kui-space-90, $kui-space-90);
  }

  .http-model-content {
    display: grid;
    gap: var(--kui-space-130, $kui-space-130);
    grid-template-columns: 1.2fr 0.8fr;

    .http-model-example-container {
      border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
      height: max-content;
      overflow: hidden;

      .http-model-example-header {
        align-items: center;
        background: var(--kui-color-background, $kui-color-background);
        border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
        color: var(--kui-color-text, $kui-color-text);
        display: flex;
        font-size: var(--kui-font-size-30, $kui-font-size-30);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        justify-content: space-between;
        line-height: var(--kui-line-height-40, $kui-line-height-40);
        padding: var(--kui-space-50, $kui-space-50);
      }
    }

  }

  @media (max-width: ($kui-breakpoint-laptop - 1px)) {
    .http-model-content {
      grid-template-columns: 1fr;

      .http-model-example-container {
        margin-top: var(--kui-space-40, $kui-space-40);
      }
    }
  }
}
</style>
