<template>
  <div class="sample-spec-selector">
    <label for="spec-selector">Select spec sample:&nbsp;</label>
    <select
      id="spec-selector"
      ref="specSelector"
      value=""
      @change="specSelected"
    >
      <option
        disabled
        value=""
      >
        Choose...
      </option>

      <option
        v-if="specType == 'all' || specType == 'oas'"
        disabled
      >
        -------------------- OAS --------------------
      </option>

      <option
        v-for="(o) in specType == 'all' || specType == 'oas' ? optionsArrayOAS : []"
        :key="o.url"
        :value="o.url"
      >
        {{ o.label }}
      </option>

      <option
        v-if="specType == 'all' || specType == 'async'"
        disabled
      >
        -------------------- ASYNC --------------------
      </option>
      <option
        v-for="(o) in specType == 'all' || specType == 'async' ? optionsArrayASYNC : []"
        :key="o.url"
        :value="o.url"
      >
        {{ o.label }}
      </option>
    </select>

    <button
      ref="dropZoneRef"
      class="dropzone"
      @click="dropzoneClick()"
    >
      {{ fName }}
    </button>

    <input
      ref="fileInputRef"
      style="position: absolute; visibility: hidden;"
      type="file"
      @change="finputChange"
    >
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PropType } from 'vue'
import { useDropZone } from '@vueuse/core'

const props = defineProps({
  basePath: {
    type: String,
    default: '/',
  },
  specType: {
    type: String as PropType<'oas' | 'async' | 'all'>,
    default: 'all',
  },
})

const emit = defineEmits<{
  (e: 'sample-spec-selected', specUrl: string, resetPath: boolean): void
  (e: 'sample-spec-uploaded', specText: string, resetPath: boolean): void
}>()

const specSelector = ref<HTMLSelectElement | null>(null)
const dropZoneRef = ref<HTMLDivElement>()
const fileInputRef = ref<HTMLInputElement>()
const savedSpec = ref()

const fName = ref<string>('Drop your own spec file')

const optionsArrayOAS = [
  { url: `${window.location.origin}/spec-renderer/specs/stoplight.yaml`, label: 'Stoplight ToDo' },
  {
    url: `${window.location.origin}/spec-renderer/specs/konnect-api.yaml`, label: 'Konnect Api' },
  {
    url: `${window.location.origin}/spec-renderer/specs/callback.yaml`, label: 'Callbacks' },
  {
    url: `${window.location.origin}/spec-renderer/specs/callback-example-2.yaml`, label: 'Callbacks example 2' },
  {
    url: `${window.location.origin}/spec-renderer/specs/cloudflare.json`, label: 'CloudFlare' },
  { url: `${window.location.origin}/spec-renderer/specs/beer-and-coffee.yaml`, label: 'Beer-and-coffee (e50ca83c443b.us)' },
  { url: `${window.location.origin}/spec-renderer/specs/multi-tags.yaml`, label: 'Multi-tags' },
  { url: `${window.location.origin}/spec-renderer/specs/Household_openspec_V11.json`, label: 'Household_openspec_V11' },
  { url: 'https://raw.githubusercontent.com/digitalocean/openapi/main/specification/DigitalOcean-public.v2.yaml', label: 'Digital Ocean' },
  { url: 'https://raw.githubusercontent.com/stoplightio/Public-APIs/master/reference/zoom/openapi.yaml', label: 'Zoom' },
  { url: 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.0/ghes-3.0.json', label: 'GitHub' },
  { url: 'https://raw.githubusercontent.com/stoplightio/Public-APIs/master/reference/netlify/openapi.yaml', label: 'Netlify' },
  { url: 'https://api.apis.guru/v2/specs/instagram.com/1.0.0/swagger.yaml', label: 'Instagram' },
  { url: 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json', label: 'Stripe' },
  { url: 'https://httpbin.org/spec.json', label: 'Httpbin' },
]


const optionsArrayASYNC = [
  { url: 'https://raw.githubusercontent.com/asyncapi/spec/master/examples/correlation-id-asyncapi.yml', label: 'Correlation ID Example' },
  { url: 'https://raw.githubusercontent.com/asyncapi/spec/master/examples/websocket-gemini-asyncapi.yml', label: 'Gemini Market Data Websocket API' },
  { url: 'https://raw.githubusercontent.com/asyncapi/spec/master/examples/slack-rtm-asyncapi.yml', label: 'Slack Real Time Messaging API' },
  { url: 'https://raw.githubusercontent.com/asyncapi/spec/master/examples/kraken-websocket-request-reply-message-filter-in-reply-asyncapi.yml', label: 'Kraken Websockets API' },
  { url: `${window.location.origin}/spec-renderer/specs/openapi-scema-in-async.yaml`, label: 'OpenApi Schema in Async spec' },

]

const trySetStorage = (str: string) => {
  try {
    window.sessionStorage.setItem('spec-renderer-playground', str)
  } catch (err) {
    console.error(err)
    window.sessionStorage.removeItem('spec-renderer-playground')
  }

}
const onDrop = async (files: File[] | null) => {
  // called when files are dropped on zone
  if (specSelector.value) {
    specSelector.value.value = ''
  }
  if (files) {
    fName.value = files[0].name
    const t = await files[0].text()
    trySetStorage(JSON.stringify({ spec: t, fName: fName.value }))

    emit('sample-spec-uploaded', t, true)
  }
}

const finputChange = () => {
  if (fileInputRef.value?.files) {
    const file = fileInputRef.value?.files[0]

    if (file) {
      const reader = new FileReader()
      reader.readAsText(file, 'UTF-8')
      reader.onload = (e) => {
        emit('sample-spec-uploaded', e.target?.result?.toString(), true)

        fName.value = file.name
        trySetStorage( JSON.stringify({ spec: e.target.result, fName: fName.value }))
        if (specSelector.value) {
          specSelector.value.value = ''
        }
      }
    }
  }
}

useDropZone(dropZoneRef, {
  onDrop,
  dataTypes: ['application/x-yaml', 'application/json'],
})

const specSelected = async () => {
  fName.value = 'Drop your own spec file'

  trySetStorage( JSON.stringify({ url: specSelector.value?.value }))
  window.history.pushState({}, '', `/spec-renderer${props.basePath}`)

  emit('sample-spec-selected', specSelector.value?.value, true)

}

const dropzoneClick = () => {
  fileInputRef.value?.click()
}

onMounted(() => {
  try {
    savedSpec.value = JSON.parse(window.sessionStorage.getItem('spec-renderer-playground') || '{}')
    if (savedSpec.value?.spec) {
      fName.value = savedSpec.value?.fName
      emit('sample-spec-uploaded', savedSpec.value?.spec, false)

    } else if (savedSpec.value?.url) {
      if (specSelector.value) {
        specSelector.value.value = savedSpec.value?.url
      }

      emit('sample-spec-selected', savedSpec.value?.url, false)
    }
  } catch (e) {
    console.error(e)
  }
})

</script>

<style lang="scss" scoped>
.sample-spec-selector {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  justify-content: center;

  select {
    -webkit-appearance: auto;
  }

  .dropzone {
    background: red;
    margin-left:40px;
    padding: 20px;
  }

  @media (min-width: $kui-breakpoint-mobile) {
    flex-direction: row;
  }
}
</style>
