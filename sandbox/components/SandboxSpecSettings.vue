<template>
  <Popover
    ref="popoverRef"
    class="sandbox-spec-settings-popover"
    placement="bottom-end"
    width="400px"
  >
    <button class="trigger-button">
      <CogIcon :size="KUI_ICON_SIZE_40" />
    </button>

    <template #content>
      <div class="spec-settings-container">
        <SelectDropdown
          v-model="specUrl"
          class="spec-selector"
          :items="specsOptions"
          :trigger-button="savedSpec && savedSpec.fName ? savedSpec.fName : 'Select spec'"
        >
          <template #upload-item>
            <button @click="upload">
              <UploadIcon />
              Upload your spec
            </button>
          </template>
        </SelectDropdown>
        <input
          ref="fileInputRef"
          hidden
          type="file"
          @change="fileInputChange"
        >

        <ToggleSwitch
          v-model="showSchemas"
          label="Show schemas"
        />
        <ToggleSwitch
          v-model="showTryIt"
          label="Show try it"
        />
      </div>
    </template>
  </Popover>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import Popover from '../../src/components/common/HeadlessPopover.vue'
import { CogIcon, UploadIcon } from '@kong/icons'
import SelectDropdown from '../../src/components/common/SelectDropdown.vue'
import ToggleSwitch from '../../src/components/common/ToggleSwitch.vue'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'

const emit = defineEmits<{
  (e: 'spec-url-change', url: string): void,
  (e: 'spec-text-change', text: string): void,
  (e: 'show-schemas-change', show: boolean): void,
  (e: 'show-try-it-change', show: boolean): void,
}>()

const specsOptions = [
  { value: 'upload', label: 'Upload your spec', key: 'upload' },
  { value: `${window.location.origin}/spec-renderer/specs/stoplight.yaml`, label: 'Stoplight ToDo' },
  {
    value: `${window.location.origin}/spec-renderer/specs/konnect-api.yaml`, label: 'Konnect Api' },
  {
    value: `${window.location.origin}/spec-renderer/specs/callback.yaml`, label: 'Callbacks' },
  {
    value: `${window.location.origin}/spec-renderer/specs/cloudflare.json`, label: 'CloudFlare' },
  { value: `${window.location.origin}/spec-renderer/specs/beer-and-coffee.yaml`, label: 'Beer-and-coffee (e50ca83c443b.us)' },
  { value: 'https://raw.githubusercontent.com/digitalocean/openapi/main/specification/DigitalOcean-public.v2.yaml', label: 'Digital Ocean' },
  { value: 'https://raw.githubusercontent.com/stoplightio/Public-APIs/master/reference/zoom/openapi.yaml', label: 'Zoom' },
  { value: 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.0/ghes-3.0.json', label: 'GitHub' },
  { value: 'https://raw.githubusercontent.com/stoplightio/Public-APIs/master/reference/netlify/openapi.yaml', label: 'Netlify' },
  { value: 'https://api.apis.guru/v2/specs/instagram.com/1.0.0/swagger.yaml', label: 'Instagram' },
  { value: 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json', label: 'Stripe' },
]

const savedSpec = ref<any>(null)
const specUrl = ref<string>('')
const specText = ref<string>('')
const showSchemas = ref<boolean>(true)
const showTryIt = ref<boolean>(true)

const fileInputRef = ref<HTMLInputElement | null>(null)
const popoverRef = ref<InstanceType<typeof Popover> | null>(null)

const upload = () => {
  fileInputRef.value?.click()
}

const fileInputChange = () => {
  if (fileInputRef.value?.files) {
    const file = fileInputRef.value?.files[0]

    if (file) {
      const reader = new FileReader()
      reader.readAsText(file, 'UTF-8')

      reader.onload = (e) => {
        specText.value = String(e.target?.result)
        trySetStorage(JSON.stringify({ spec: String(e.target?.result), fName: file.name }))
        savedSpec.value = { spec: String(e.target?.result), fName: file.name }
      }
    }
  }
}

const trySetStorage = (str: string) => {
  try {
    window.sessionStorage.setItem('spec-renderer-playground', str)
  } catch (err) {
    console.error(err)
    window.sessionStorage.removeItem('spec-renderer-playground')
  }
}

watch(specUrl, (val) => {
  if (val) {
    emit('spec-url-change', val)

    specText.value = ''
    popoverRef.value?.hidePopover()
    trySetStorage(JSON.stringify({ url: val }))
    savedSpec.value = { url: val }
  }
})

watch(specText, (val) => {
  if (val) {
    emit('spec-text-change', val)

    specUrl.value = ''
    popoverRef.value?.hidePopover()
  }
})

watch(showSchemas, (val) => {
  emit('show-schemas-change', val)
})

watch(showTryIt, (val) => {
  emit('show-try-it-change', val)
})

onMounted(() => {
  try {
    savedSpec.value = JSON.parse(window.sessionStorage.getItem('spec-renderer-playground') || '{}')

    if (savedSpec.value?.spec) {
      specText.value = savedSpec.value?.spec
    } else if (savedSpec.value?.url) {
      specUrl.value = savedSpec.value?.url
    }
  } catch (e) {
    console.error(e)
  }
})
</script>

<style lang="scss" scoped>
.sandbox-spec-settings-popover {
  margin-right: $kui-space-40;

  .trigger-button {
    @include default-button-reset;

    color: $kui-color-text-inverse;

    &:hover {
      color: $kui-color-text-neutral-weaker;
    }
  }

  .spec-settings-container {
    background-color: $kui-color-background;
    border-radius: $kui-border-radius-30;
    box-shadow: $kui-shadow;
    display: flex;
    flex-direction: column;
    gap: $kui-space-50;
    width: 100%;
    padding: $kui-space-40;
    box-sizing: border-box;
  }

  .spec-selector {
    width: 100%;

    :deep(.popover-trigger-wrapper) {
      width: 100%;

      .trigger-button {
        border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
        width: 100%;
        justify-content: space-between;
      }
    }
  }
}
</style>
