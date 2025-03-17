<template>
  <div
    class="body-content-list"
    data-testid="endpoint-body-content-list"
  >
    <MarkdownRenderer
      v-if="description"
      class="body-content-list-description"
      :markdown="description"
    />
    <template
      v-for="content in contents"
      :key="content.id"
    >
      <CollapsibleSection
        v-if="content.schema?.title"
        :border-visible="false"
      >
        <template
          v-if="content.schema.title"
          #title
        >
          <h4 class="content-list-schema-title">
            {{ content.schema.title }}
          </h4>
        </template>
        <ContentListItemSchema :schema="parseSchema(content.schema)" />
      </CollapsibleSection>
      <ContentListItemSchema
        v-else-if="content.schema"
        :schema="parseSchema(content.schema)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IMediaTypeContent } from '@stoplight/types'
import CollapsibleSection from './CollapsibleSection.vue'
import ContentListItemSchema from './ContentListItemSchema.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import type { SchemaObject } from '@/types'
import { removeFieldsFromSchemaObject, resolveSchemaObjectFields } from '@/utils'

const props = defineProps({
  description: {
    type: String,
    default: '',
  },
  contents: {
    type: Array as PropType<Array<IMediaTypeContent>>,
    required: true,
  },
  readonlyVisible: {
    type: Boolean,
    default: true,
  },
})

function parseSchema(schema: SchemaObject) {
  const resolvedSchema = resolveSchemaObjectFields(schema)
  return props.readonlyVisible ? resolvedSchema : removeFieldsFromSchemaObject(resolvedSchema)
}
</script>

<style lang="scss" scoped>
.body-content-list {
  padding: var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0);

  .body-content-list-description {
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    margin-bottom: var(--kui-space-40, $kui-space-40);
  }

  .content-list-schema-title {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    overflow-wrap: anywhere;
  }
}
</style>
