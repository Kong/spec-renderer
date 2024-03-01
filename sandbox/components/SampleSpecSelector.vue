<template>
  <div class="sample-spec-selector">
    Select spec sample:&nbsp;
    <select
      ref="specSelector"
      value=""
      @change="specSelected"
    >
      <option
        selected="selected"
        value=""
      >
        Choose...
      </option>
      <option value="/spec-renderer/specs/stoplight.yaml">
        Stoplight ToDo
      </option>
      <option value="/spec-renderer/specs/konnect-api.yaml">
        Konnect Api Public
      </option>
      <option value="https://raw.githubusercontent.com/digitalocean/openapi/main/specification/DigitalOcean-public.v2.yaml">
        Digital Ocean
      </option>
      <option value="https://raw.githubusercontent.com/stoplightio/Public-APIs/master/reference/zoom/openapi.yaml">
        Zoom
      </option>
      <option value="https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.0/ghes-3.0.json">
        GitHub
      </option>
      <option value="https://raw.githubusercontent.com/stoplightio/Public-APIs/master/reference/netlify/openapi.yaml">
        Netlify
      </option>
      <option value="https://api.apis.guru/v2/specs/instagram.com/1.0.0/swagger.yaml">
        Instagram
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'sample-spec-selected', specUrl: string): void
}>()

const specSelector = ref<HTMLElement | null>(null)

const specSelected = () => {
  emit('sample-spec-selected', specSelector.value?.value)
}
</script>

<style lang="scss" scoped>
.sample-spec-selector {
  margin-bottom: 20px;
  select {
    -webkit-appearance: auto;
  }
}
</style>
