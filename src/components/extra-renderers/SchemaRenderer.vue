<template>
  <div
    class="schema-renderer"
    :class="{'reset-margin': markdownStyles}"
  >
    <PageHeader
      v-if="showHeader && schemaTitle"
      class="schema-renderer-header"
      :description="schema.description"
      :title="schemaTitle"
      :type="schemaType"
    />

    <div
      class="schema-renderer-content"
      :class="{'model-example-visible': showExample}"
    >
      <div>
        <PropertyFieldList
          :hidden-field-list="hiddenFieldList"
          :property="activeSchemaModel"
          :required-fields="activeSchemaModel?.required"
        />
        <ModelNode
          v-bind="modelNodeProps"
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
import { computed, onBeforeMount, provide, ref } from 'vue'
import type { Ref } from 'vue'
import type { SchemaModelPropertyField, SchemaObject } from '@/types'
import ModelNode from '@/components/spec-document/schema-model/ModelNode.vue'
import PropertyFieldList from '@/components/spec-document/schema-model/PropertyFieldList.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SchemaExample from '@/components/common/SchemaExample.vue'
import composables from '@/composables'
import { BOOL_VALIDATOR, convertToNumber, crawl, IS_TRUE, NUMBER_VALIDATOR } from '@/utils'
import { parse as parseFlatted } from 'flatted'
import { CODE_INDENT_SPACES, DEFAULT_EXPANDED_PROPERTIES_DEPTH } from '@/constants'

const props = defineProps({
/**
 * JSON schema to render
 */
  schema: {
    type: [Object, String],
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
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: true,
  },
  /**
   * show/hide example section
   */
  exampleVisible: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: true,
  },
  /**
   * enable links to individual properties of a Schema Model
   */
  enablePropertyLinks: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: false,
  },
  /**
   * The max depth until which nested properties should remain expanded by default.
   */
  maxExpandedDepth: {
    type: [Number, String],
    validator: NUMBER_VALIDATOR,
    default: DEFAULT_EXPANDED_PROPERTIES_DEPTH,
  },
  /**
   * Use default markdown styling
   */
  markdownStyles: {
    type: [Boolean, String],
    validator: BOOL_VALIDATOR,
    default: true,
  },
})

provide<Ref<number>>('max-expanded-depth', computed((): number => convertToNumber(props.maxExpandedDepth) || DEFAULT_EXPANDED_PROPERTIES_DEPTH))
provide<Ref<boolean>>('markdown-styles', computed((): boolean => IS_TRUE(props.markdownStyles)))

const schema = computed((): SchemaObject => {
  if (typeof props.schema === 'string') {
    try {
      return <SchemaObject>parseFlatted(props.schema)
    } catch {
      console.error('@kong/spec-renderer: error parsing provided JSON Schema')
      return {}
    }
  }
  return <SchemaObject>props.schema
})
const showHeader = computed((): boolean => IS_TRUE(props.headerVisible))
const showExample = computed((): boolean => IS_TRUE(props.exampleVisible))

const modelNodeProps = computed(() => ({
  schema: schema.value,
  title: props.title,
  ...(IS_TRUE(props.enablePropertyLinks) ? { basePathId: `schema-${schemaTitle.value}` } : null),
}))

const activeSchemaModel = ref<SchemaObject>(schema.value)

const { createHighlighter } = composables.useShiki()

// initialize shiki
onBeforeMount(async () => {
  await createHighlighter()
})

const exampleModel = computed(() => {
  if (!showExample.value) {
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

/**
 * list of fields to hide from the property field list
 * - info and description fields are always hidden
 * - example field is hidden when exampleVisible prop is false or exampleModel is rendered inside the example section
 */
const hiddenFieldList = computed<Array<SchemaModelPropertyField>>(() =>
  exampleModel.value || !showExample.value
    ? ['info', 'description', 'example']
    : ['info', 'description'],
)

const schemaTitle = computed(() => schema.value.title || props.title)
const schemaType = computed(() => schema.value.type?.toString())
</script>

<style lang="scss" scoped>
.schema-renderer {
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
      grid-template-columns: auto clamp(#{$spec-renderer-secondary-column-min-width}, 40%, #{$spec-renderer-secondary-column-max-width});
    }
  }
}

.reset-margin {
  * {
    margin: var(--kui-space-0, $kui-space-0);
  }
}
</style>
