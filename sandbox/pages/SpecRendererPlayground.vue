<template>
  <div>
    <div class="sandbox-controls-container">
      <SampleSpecSelector
        @sample-spec-selected="sampleSpecSelected"
        @sample-spec-uploaded="sampleSpecUploaded"
      />
      <div>
        <input
          id="hide-schemas"
          v-model="hideSchemas"
          type="checkbox"
        >
        <label for="hide-schemas">Hide schemas</label>
        |
        <input
          id="hide-tryit"
          v-model="hideTryIt"
          type="checkbox"
        >
        <label for="hide-tryit">Hide TryIt</label>

        |
        <label for="navigation-type">Navigation: &nbsp;</label>
        <select
          id="navigation-type"
          v-model="navigationType"
        >
          <option value="path">
            path
          </option>
          <option value="hash">
            hash
          </option>
        </select>
      </div>
    </div>
    <SpecRenderer
      v-if="specText || specUrl"
      base-path="/spec-renderer"
      :control-address-bar="true"
      :current-path="currentPath"
      :hide-schemas="hideSchemas"
      :hide-try-it="hideTryIt"
      :navigation-type="navigationType"
      :spec="specText"
      :spec-url="specUrl"
      :trace-parsing="true"
      @path-not-found="handlePathNotFound"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SampleSpecSelector from '../components/SampleSpecSelector.vue'
import SpecRenderer from '../../src/components/SpecRenderer.vue'
import type { NavigationTypes } from '../../src/types'
import { useRoute as useVueRoute } from 'vue-router'

const route = useVueRoute()

const navigationType = ref<NavigationTypes>(route.hash ? 'hash' : 'path')

const specText = ref<string>('')
const specUrl = ref<string>('')
const currentPath = ref<string>(navigationType.value === 'path' ? route.path : route.hash.replace('#', ''))
const hideSchemas = ref<boolean>(false)
const hideTryIt = ref<boolean>(false)

const handlePathNotFound = (requestedPath: string) => {
  console.error(`${requestedPath} not found. App to redirect to it's own 404`)
}

const sampleSpecSelected = async (sampleSpecUrl: string, resetPath: boolean) => {
  specText.value = ''
  specUrl.value = sampleSpecUrl
  if (resetPath) {
    currentPath.value = '/'
  }
}

const sampleSpecUploaded = (sampleSpecText: string, resetPath: boolean) => {
  specUrl.value = ''
  specText.value = sampleSpecText
  if (resetPath) {
    currentPath.value = '/'
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
