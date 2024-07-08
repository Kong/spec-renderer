<template>
  <div
    v-if="showToggle"
    class="wide required-only-wrapper"
  >
    <InputLabel>
      Show only required parameters
    </InputLabel>

    <ToggleSwitch
      id="sandbox-toggle-switch"
      v-model="toggleValue"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
    console.log('objData:', objData)
    if (nestedLevel > MAX_NESTED_LEVELS) {
      return false
    }

    if (objData.required && objData.required.length > 0) {
      console.log('here')
      return true
    }
    let requiredFound = false
    Object.keys(objData.properties || {}).forEach((key: string) => {
      const oData = objData.properties[key]
      console.log('oData:', oData)
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

  console.log('aaa:', props.data.request.body.contents[0])

  return crawlForRequired((props.data.request.body.contents[0].schema) as Record<string, any>, '', 0)
})


</script>

<style lang="scss" scoped>
.required-only-wrapper {
  flex-direction: row !important;
  label {
    display: inline !important;
    flex: 1;
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
  }

}
</style>
