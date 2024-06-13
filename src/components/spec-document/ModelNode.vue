<template>
  <div
    class="spec-model-node"
    :data-testid="dataTestId"
  >
    <PageHeader
      v-if="headerVisible"
      class="spec-model-node-header"
      :description="data.description"
      :title="title"
    />

    <div
      v-if="modelPropertyProps"
      class="spec-model-node-properties"
    >
      <template
        v-for="(property, propertyName) in modelPropertyProps.properties"
        :key="propertyName"
      >
        <ModelProperty
          v-if="isValidSchemaObject(property)"
          :data-testid="`model-property-${propertyName}`"
          :property="property"
          :property-name="propertyName.toString()"
          :required-fields="modelPropertyProps.required"
        />
      </template>
      <PropertyOneOf
        v-if="Array.isArray(modelPropertyProps.oneOf) && modelPropertyProps.oneOf?.length"
        :one-of-list="modelPropertyProps.oneOf"
      />

      <PropertyAnyOf
        v-if="Array.isArray(modelPropertyProps.anyOf) && modelPropertyProps.anyOf?.length"
        :any-of-list="modelPropertyProps.anyOf"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { SchemaObject } from '@/types'
import { isValidSchemaObject, resolveSchemaObjectFields } from '@/utils'
import ModelProperty from './ModelProperty.vue'
import PropertyAnyOf from './property-fields/PropertyAnyOf.vue'
import PropertyOneOf from './property-fields/PropertyOneOf.vue'
import PageHeader from '../common/PageHeader.vue'

const props = defineProps({
  data: {
    type: Object as PropType<SchemaObject>,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  // used when only properties, oneOf and anyOf are to be rendered, without title or description
  // e.g. in request body
  headerVisible: {
    type: Boolean,
    default: true,
  },
})

const modelPropertyProps = computed(() => resolveSchemaObjectFields(props.data))
const dataTestId = computed(() => `model-node-${props.title.replaceAll(' ', '-')}`)
</script>

<style lang="scss" scoped>
.spec-model-node {
  * {
    margin: var(--kui-space-0, $kui-space-0);
  }

  .spec-model-node-header {
    margin-bottom: var(--kui-space-80, $kui-space-80);
  }
}
</style>
