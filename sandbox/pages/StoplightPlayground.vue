<template>
  <SampleSpecSelector
    @sample-spec-selected="sampleSpecSelected"
    @sample-spec-uploaded="sampleSpecUploaded"
  />
  Layout:
  <input
    checked
    name="layout"
    type="radio"
    value="sidebar"
    @click="layoutChanged"
  >sidebar
  <input
    name="layout"
    type="radio"
    value="responsive"
    @click="layoutChanged"
  >responsive
  <input
    name="layout"
    type="radio"
    value="stacked"
    @click="layoutChanged"
  >stacked

  <hr>
  <br>
  <elements-api
    id="docs"
    ref="specRenderer"
  />
</template>

<script setup lang="ts">

import { useScriptTag } from '@vueuse/core'
import { onBeforeMount, ref } from 'vue'
import SampleSpecSelector from '../components/SampleSpecSelector.vue'

const specRenderer = ref<HTMLElement | null>(null)

const scriptLoaded = ref<boolean>(false)

const { load } = useScriptTag(
  'https://unpkg.com/@stoplight/elements/web-components.min.js',
  () => {
    // do something
    scriptLoaded.value = true
  },
  { manual: true },
)

const sampleSpecSelected = (sampleSpecUrl : string) => {
  // @ts-ignore
  specRenderer.value.basePath = '/spec-renderer/stoplight'
  specRenderer.value.router = 'history'
  specRenderer.value.apiDescriptionDocument = ''
  specRenderer.value.apiDescriptionUrl = sampleSpecUrl
}

const sampleSpecUploaded = (sampleSpecText: string) => {
  specRenderer.value.basePath = '/spec-renderer/stoplight'
  specRenderer.value.router = 'history'
  specRenderer.value.apiDescriptionDocument = sampleSpecText
}

const layoutChanged = (e) => {
  if (specRenderer.value) {
    // @ts-ignore
    specRenderer.value.layout = e.target.value
  }
}
onBeforeMount(async () => {
  document.getElementsByTagName('head')[0].insertAdjacentHTML(
    'beforeend',
    '<link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css" />')

  await load()
})
</script>

<style lang="scss" scoped>
textarea {
  width: 100%;
  height:300px;
  border:1px solid gray
}
</style>
