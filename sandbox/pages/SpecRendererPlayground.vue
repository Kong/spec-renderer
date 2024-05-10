<template>
  <div>
    <SampleSpecSelector
      @sample-spec-selected="sampleSpecSelected"
      @sample-spec-uploaded="sampleSpecUploaded"
    />

    <SpecRenderer
      v-if="specText || specUrl"
      base-path="/spec-renderer/parser"
      :spec="specText"
      :spec-url="specUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SampleSpecSelector from '../components/SampleSpecSelector.vue'
import SpecRenderer from '../../src/components/SpecRenderer.vue'

const specText = ref<string>('')
const specUrl = ref<string>('')

const sampleSpecSelected = async (sampleSpecUrl: string) => {
  specUrl.value = sampleSpecUrl
}

const sampleSpecUploaded = (sampleSpecText: string) => {
  specText.value = sampleSpecText
}

</script>
