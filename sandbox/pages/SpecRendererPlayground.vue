<template>
  <div>
    <div class="sandbox-controls-container">
      <SampleSpecSelector
        @sample-spec-selected="sampleSpecSelected"
        @sample-spec-uploaded="sampleSpecUploaded"
      />
      <KInputSwitch
        v-model="hideSchemas"
        label="Hide schema"
      />
    </div>
    <SpecRenderer
      v-if="specText || specUrl"
      base-path="/spec-renderer"
      :hide-schemas="hideSchemas"
      :selected-path="selectedPath"
      :spec="specText"
      :spec-url="specUrl"
      :trace-parsing="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SampleSpecSelector from '../components/SampleSpecSelector.vue'
import SpecRenderer from '../../src/components/SpecRenderer.vue'

import { useRoute as useVueRoute } from 'vue-router'

const route = useVueRoute()

const specText = ref<string>('')
const specUrl = ref<string>('')
const selectedPath = ref<string>(route.path)
const hideSchemas = ref<boolean>(false)

const sampleSpecSelected = async (sampleSpecUrl: string, resetPath: boolean) => {
  specText.value = ''
  specUrl.value = sampleSpecUrl
  if (resetPath) {
    selectedPath.value = '/'
  }
}

const sampleSpecUploaded = (sampleSpecText: string, resetPath: boolean) => {
  specUrl.value = ''
  specText.value = sampleSpecText
  if (resetPath) {
    selectedPath.value = '/'
  }
}
</script>

<style land="scss" scoped>
.sandbox-controls-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
}
</style>
