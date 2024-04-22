<template>
  <div class="sample-spec-selector">
    <div>Select spec sample:&nbsp;</div>
    <select ref="specSelector" value="" @change="specSelected">
      <option disabled value="">
        Choose...
      </option>

      <option disabled value="">
        ------------------
      </option>

      <option value="specs/stoplight.yaml">
        Stoplight ToDo
      </option>
      <option value="specs/konnect-api.yaml">
        Konnect Api
      </option>
      <option value="specs/callback.yaml">
        Callbacks
      </option>
      <option
        value="https://raw.githubusercontent.com/digitalocean/openapi/main/specification/DigitalOcean-public.v2.yaml">
        Digital Ocean
      </option>
      <option value="https://raw.githubusercontent.com/stoplightio/Public-APIs/master/reference/zoom/openapi.yaml">
        Zoom
      </option>
      <option
        value="https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.0/ghes-3.0.json">
        GitHub
      </option>
      <option value="https://raw.githubusercontent.com/stoplightio/Public-APIs/master/reference/netlify/openapi.yaml">
        Netlify
      </option>
      <option value="https://api.apis.guru/v2/specs/instagram.com/1.0.0/swagger.yaml">
        Instagram
      </option>
      <option value="https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json">
        Stripe
      </option>
    </select>

    <button ref="dropZoneRef" class="dropzone" @click="dropzoneClick()">
      {{ fName }}
    </button>

    <input ref="fileInputRef" style="position: absolute; visibility: hidden;" type="file" @change="finputChange">
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDropZone } from '@vueuse/core'

const emit = defineEmits<{
  (e: 'sample-spec-selected', specUrl: string): void,
  (e: 'sample-spec-uploaded', specText: string): void
}>()

const specSelector = ref<HTMLElement | null>(null)
const dropZoneRef = ref<HTMLDivElement>()
const fileInputRef = ref<HTMLDivElement>()

const fName = ref<string>('Drop your own spec file')

const onDrop = async (files: File[] | null) => {
  // called when files are dropped on zone
  specSelector.value.value = ''
  fName.value = files[0].name
  const t = await files[0].text()
  emit('sample-spec-uploaded', t)
}

const finputChange = () => {
  const file = fileInputRef.value.files[0]

  if (file) {
    const reader = new FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = (e) => {
      emit('sample-spec-uploaded', e.target.result)
      fName.value = file.name
      specSelector.value.value = ''
    }
  }
}

useDropZone(dropZoneRef, {
  onDrop,
  dataTypes: ['application/x-yaml', 'application/json'],
})

const specSelected = () => {
  fName.value = 'Drop your own spec file'

  emit('sample-spec-selected', specSelector.value?.value)
}

const dropzoneClick = () => {
  fileInputRef.value?.click()
}
</script>

<style lang="scss" scoped>
.sample-spec-selector {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  select {
    -webkit-appearance: auto;
  }
  .dropzone {
    background: red;
    margin-left:40px;
    padding: 20px;
  }
}
</style>
