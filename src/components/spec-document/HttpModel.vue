<template>
  <div
    class="http-model"
    :data-testid="dataTestId"
  >
    <PageHeader
      class="http-model-header"
      :description="data.description"
      :title="title"
      :type="data.type?.toString()"
    />

    <div class="http-model-content">
      <div>
        <PropertyFieldList
          :hidden-field-list="hiddenFieldList"
          :property="activeSchemaModel"
          :property-name="title"
          :required-fields="activeSchemaModel?.required"
        />
        <ModelNode
          :schema="data"
          :title="title"
          @selected-model-changed="(newModel: SchemaObject) => activeSchemaModel = newModel"
        />
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
import type { SchemaModelPropertyField, SchemaObject } from '@/types'
import ModelNode from './schema-model/ModelNode.vue'
import PageHeader from '../common/PageHeader.vue'
import SchemaExample from '../common/SchemaExample.vue'
import PropertyFieldList from './schema-model/PropertyFieldList.vue'
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

const hiddenFieldList = computed<Array<SchemaModelPropertyField>>(() =>
  exampleModel.value
    ? ['info', 'description', 'example']
    : ['info', 'description'],
)
</script>

<style lang="scss" scoped>
@mixin http-model-content-small {
  grid-template-columns: 1fr;

  .http-model-example-container {
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}

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
    grid-template-columns: auto clamp($spec-renderer-secondary-column-min-width, 40%, $spec-renderer-secondary-column-max-width);

    @supports (container: inline-size) {
      // need to use interpolation for the token here because otherwise the query don't work
      @container spec-document (max-width: #{$kui-breakpoint-tablet - 1px}) {
        @include http-model-content-small;
      }
    }

    // regular media query fallback
    @supports not (container: inline-size) {
      @media (max-width: ($kui-breakpoint-laptop - 1px)) {
        @include http-model-content-small;
      }
    }
  }
}
</style>
