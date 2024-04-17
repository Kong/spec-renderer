<template>
  <div>
    <SampleSpecSelector
      @sample-spec-selected="sampleSpecSelected"
      @sample-spec-uploaded="sampleSpecUploaded"
    />

    <SpecRenderer
      v-if="specText"
      base-path="/spec-renderer/parser"
      :spec="specText"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SampleSpecSelector from '../components/SampleSpecSelector.vue'
import SpecRenderer from '../../src/components/SpecRenderer.vue'

const specText = ref<string>('')

const sampleSpecSelected = async (sampleSpecUrl: string) => {
  specText.value = await fetch(sampleSpecUrl).then(res => res.text())
  console.log('reading:', sampleSpecUrl)
}

const sampleSpecUploaded = (sampleSpecText: string) => {
  specText.value = sampleSpecText
}

</script>
