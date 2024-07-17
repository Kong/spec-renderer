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
        :schema="data"
        :title="title"
        @selected-model-changed="(newModel: SchemaObject) => activeSchemaModel = newModel"
      />
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
import type { SchemaObject } from '@/types'
import ModelNode from './schema-model/ModelNode.vue'
import PageHeader from '../common/PageHeader.vue'
import SchemaExample from '../common/SchemaExample.vue'
import { crawl } from '@/utils'
import { CODE_INDENT_SPACES } from '@/constants'

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
const activeSchemaModel = ref<SchemaObject>(props.data)
const exampleModel = computed(() => {
  const crawledExample = crawl({
    objData: activeSchemaModel.value,
    parentKey: '',
    nestedLevel: 0,
    filteringOptions: { excludeReadonly: false, excludeNotRequired: false },
  })
  return crawledExample && Object.keys(crawledExample).length ? JSON.stringify(crawledExample, null, CODE_INDENT_SPACES) : ''
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
