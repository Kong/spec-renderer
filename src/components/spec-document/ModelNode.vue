<template>
  <div
    class="spec-model-node"
    :data-testid="dataTestId"
  >
    <h3 class="spec-model-node-title">
      {{ title }}
    </h3>
    <p
      v-if="data.description"
      class="spec-model-node-description"
    >
      {{ data.description }}
    </p>

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

const modelPropertyProps = computed(() => resolveSchemaObjectFields(props.data))
const dataTestId = computed(() => `model-node-${props.title.replaceAll(' ', '-')}`)
</script>

<style lang="scss" scoped>
.spec-model-node {
  .spec-model-node-title {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-80, $kui-font-size-80);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    line-height: var(--kui-line-height-70, $kui-line-height-70);
    margin: var(--kui-space-0, $kui-space-0);
    margin-bottom: var(--kui-space-60, $kui-space-60);
  }
  .spec-model-node-description {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
  }

  .spec-model-node-properties {
    @include tree-nesting
  }
}
</style>
