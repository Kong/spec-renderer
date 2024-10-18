<template>
  <div
    v-if="showToggle"
    class="wide required-only-wrapper"
  >
    <InputLabel
      :for="`required-toggle-switch-${data.id}`"
    >
      Show only required parameters
    </InputLabel>

    <ToggleSwitch
      :id="`required-toggle-switch-${data.id}`"
      v-model="toggleValue"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { PropType } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import InputLabel from '@/components/common/InputLabel.vue'
import ToggleSwitch from '@/components/common/ToggleSwitch.vue'
import { MAX_NESTED_LEVELS } from '@/constants'

const props = defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const toggleValue = defineModel({
  type: Boolean,
  default: true,
})


const showToggle = computed((): boolean => {
  // no body - no toggle
  if (!props.data.request?.body?.contents?.length || !props.data.request.body.contents[0]) {
    return false
  }

  // if there are examples - we do not show toggle
  if (props.data?.request?.body?.contents && props.data.request.body.contents.length &&
    Array.isArray(props.data.request.body.contents[0].examples) &&
    props.data.request.body.contents[0].examples.length) {
    return false
  }

  const crawlForRequired = (objData: Record<string, any>, parentKey: string, nestedLevel: number): boolean => {
    if (nestedLevel > MAX_NESTED_LEVELS || !objData || Object.keys(objData).length < 1) {
      return false
    }

    if (objData.required && objData.required.length > 0) {
      return true
    }
    let requiredFound = false
    Object.keys(objData.properties || {}).forEach((key: string) => {
      const oData = objData.properties[key]
      if (oData.anyOf && Array.isArray(oData.anyOf) && oData.anyOf.length) {
        requiredFound = crawlForRequired(oData.anyOf[0] || {}, key, nestedLevel)
      } else if (oData.type === 'object' || oData.allOf) {
        requiredFound = crawlForRequired(oData || {}, key, ++nestedLevel)
      } else {
        requiredFound = crawlForRequired(objData.properties[key], key, nestedLevel)
      }
    })
    return requiredFound
  }

  return crawlForRequired((props.data.request.body.contents[0].schema) as Record<string, any>, '', 0)
})

watch(showToggle, (nV: boolean) => {
  // when we do not show toggle, we want to make sure all (not ony required) fields are shown
  if (nV === false) {
    toggleValue.value = false
  }
}, { immediate: true })

</script>

<style lang="scss" scoped>
.required-only-wrapper {
  align-items: center;
  flex-direction: row !important;
  label {
    display: inline !important;
    flex: 1;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
  }

}
</style>
