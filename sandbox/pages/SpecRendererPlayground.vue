<template>
  <div>
    <SampleSpecSelector
      @sample-spec-selected="sampleSpecSelected"
    />

    <SpecRenderer
      v-if="specText"
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

</script>
