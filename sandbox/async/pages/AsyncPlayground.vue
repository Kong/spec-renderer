<template>
  <SampleSpecSelector
    base-path="/async"
    spec-type="async"
    @sample-spec-selected="sampleSpecSelected"
    @sample-spec-uploaded="sampleSpecUploaded"
  />

  <hr>
  <br>

  <asyncapi-component
    ref="specRenderer"
    :config="config"
    css-import-path="https://unpkg.com/@asyncapi/react-component@latest/styles/default.min.css"
  />
</template>

<script setup lang="ts">
import { ref, onBeforeMount, onMounted } from 'vue'
import { useScriptTag } from '@vueuse/core'
import SampleSpecSelector from '../../components/SampleSpecSelector.vue'

const config = '{ "show": { "info": true, "sidebar": true, "messageExamples": true } }'
const specRenderer = ref<HTMLElement | null>(null)

const { load: load1 } = useScriptTag(
  'https://unpkg.com/@webcomponents/webcomponentsjs@latest/webcomponents-bundle.js',
  () => {
  },
  { manual: true },
)

const { load: load2 } = useScriptTag(
  'https://unpkg.com/@asyncapi/web-component@latest/lib/asyncapi-web-component.js',
  () => {
  },
  { manual: true },
)

const sampleSpecSelected = (sampleSpecUrl : string) => {
  specRenderer.value.schemaUrl = sampleSpecUrl
}

const sampleSpecUploaded = (sampleSpecText: string) => {
  specRenderer.value.schema = sampleSpecText
}

onBeforeMount(async () => {
  await [load1(), load2()]
})

onMounted(() => {
  setTimeout(() => {
    const shadow = specRenderer.value?.shadowRoot
    // give it a timr for shadow dom to be created
    if (shadow) {
      let stylesheet = document.createElement('link')
      stylesheet.rel = 'stylesheet'
      stylesheet.type = 'text/css'
      stylesheet.href = 'https://unpkg.com/@asyncapi/react-component@latest/styles/default.min.css'
      shadow.appendChild(stylesheet)
    }
  }, 500)

})


</script>

