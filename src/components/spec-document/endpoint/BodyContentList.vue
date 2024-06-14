<template>
  <CollapsibleSection
    class="endpoint-body-content-list"
    data-testid="endpoint-body-content-list"
  >
    <template #title>
      <h2 class="request-body-title">
        Body
      </h2>
    </template>

    <div class="request-body-content">
      <p
        v-if="description"
        class="request-body-description"
      >
        {{ description }}
      </p>
      <template
        v-for="content in contents"
        :key="content.id"
      >
        <CollapsibleSection v-if="content.schema">
          <template
            v-if="content.schema.title"
            #title
          >
            <h3 class="request-body-model-title">
              {{ content.schema.title }}
            </h3>
          </template>
          <div class="request-body-model-content">
            <p
              v-if="content.schema.description"
              class="request-body-model-description"
            >
              {{ content.schema.description }}
            </p>
            <ModelNode
              :schema="parseSchema(content.schema)"
              :title="content.schema.title"
            />
          </div>
        </CollapsibleSection>
      </template>
    </div>
  </CollapsibleSection>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IMediaTypeContent } from '@stoplight/types'
import ModelNode from '../schema-model/ModelNode.vue'
import CollapsibleSection from './CollapsibleSection.vue'
import type { SchemaObject } from '@/types'
import { removeFieldsFromSchemaObject } from '@/utils'

const props = defineProps({
  description: {
    type: String,
    default: '',
  },
  contents: {
    type: Array as PropType<Array<IMediaTypeContent>>,
    required: true,
  },
  defaultModelTitle: {
    type: String,
    default: 'Request Body Schema Model',
  },
  readonlyVisible: {
    type: Boolean,
    default: true,
  },
})

function parseSchema(schema: SchemaObject) {
  return props.readonlyVisible ? schema : removeFieldsFromSchemaObject(schema)
}
</script>

<style lang="scss" scoped>
.endpoint-body-content-list {
  .request-body-title {
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
  }

  .request-body-content {
    padding: var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0);

    .request-body-description {
      color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
      margin-bottom: var(--kui-space-40, $kui-space-40);
    }

    .request-body-model-title {
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
    }

    .request-body-model-content {
      margin-top: var(--kui-space-50, $kui-space-50);
      .request-body-model-description {
        margin-bottom: var(--kui-space-40, $kui-space-40);
      }
    }
  }

}
</style>
