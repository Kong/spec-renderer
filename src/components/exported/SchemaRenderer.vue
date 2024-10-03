<template>
  <div
    class="schema-renderer"
  >
    <PageHeader
      v-if="headerVisible && schemaTitle"
      class="schema-renderer-header"
      :description="schema.description"
      :title="schemaTitle"
      :type="schemaType"
    />

    <div
      class="schema-renderer-content"
      :class="{'model-example-visible': exampleVisible}"
    >
      <div>
        <PropertyFieldList
          :hidden-field-list="hiddenFieldList"
          :property="activeSchemaModel"
          :required-fields="activeSchemaModel?.required"
        />
        <ModelNode
          :schema="schema"
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
import ModelNode from '@/components/spec-document/schema-model/ModelNode.vue'
import PropertyFieldList from '@/components/spec-document/schema-model/PropertyFieldList.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SchemaExample from '@/components/common/SchemaExample.vue'
import { crawl } from '@/utils'
import { CODE_INDENT_SPACES } from '@/constants'

const props = defineProps({
/**
 * JSON schema to render
 */
  schema: {
    type: Object as PropType<SchemaObject>,
    required: true,
  },
  /**
   * Fallback title to display for schema
   */
  title: {
    type: String,
    default: '',
  },
  /**
   * show/hide the title and description header
   */
  headerVisible: {
    type: Boolean,
    default: true,
  },
  /**
   * show/hide example section
   */
  exampleVisible: {
    type: Boolean,
    default: true,
  },

})

const activeSchemaModel = ref<SchemaObject>(props.schema)

const exampleModel = computed(() => {
  if (!props.exampleVisible) {
    return null
  }

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

const schemaTitle = computed(() => props.schema.title || props.title)
const schemaType = computed(() => props.schema.type?.toString())
</script>

<style lang="scss" scoped>
.schema-renderer {
  * {
    margin: var(--kui-space-0, $kui-space-0);
  }

  .schema-renderer-header {
    margin-bottom: var(--kui-space-90, $kui-space-90);
  }

  .schema-renderer-content {

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

    &.model-example-visible {
      display: grid;
      gap: var(--kui-space-130, $kui-space-130);
      grid-template-columns: auto clamp($spec-renderer-secondary-column-min-width, 40%, $spec-renderer-secondary-column-max-width);
    }
  }
}
</style>
