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

    <SelectDropdown
      v-if="variantSelectItemList.length"
      :id="`${dataTestId}-variant-select-dropdown`"
      v-model="selectedVariantOption"
      :items="variantSelectItemList"
      @change="handleVariantSelectChange"
    />

    <ModelNode
      :schema="selectedSchemaModel"
      :title="title"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import type { SchemaObject, SelectItem } from '@/types'
import ModelNode from './schema-model/ModelNode.vue'
import PageHeader from '../common/PageHeader.vue'
import SelectDropdown from '../common/SelectDropdown.vue'
import { resolveSchemaObjectFields } from '@/utils'
import useSchemaVariants from '@/composables/useSchemaVariants'

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
const { variantSelectItemList, selectedSchemaModel, selectedVariantIndex } = useSchemaVariants(resolvedSchemaObject)

const selectedVariantOption = ref('0')
function handleVariantSelectChange(selecteditem: SelectItem) {
  selectedVariantIndex.value = Number(selecteditem.value)
}
</script>

<style lang="scss" scoped>
.http-model {
  * {
    margin: var(--kui-space-0, $kui-space-0);
  }

  .http-model-header {
    margin-bottom: var(--kui-space-80, $kui-space-80);
  }
}
</style>
