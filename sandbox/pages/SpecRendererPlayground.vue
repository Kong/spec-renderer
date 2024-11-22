<template>
  <div
    ref="dropzone"
    class="spec-renderer-playground"
  >
    <header>
      <h1>Kong Spec Renderer {{ isOverDropZone ? ' (drop zone)' : '' }}</h1>
      <SelectDropdown
        v-model="editorLanguage"
        class="language-selector"
        :items="[{ label: 'JSON', value: 'json' }, { label: 'YAML', value: 'yaml' }]"
      />
      <button
        class="upload-spec-file"
        type="button"
        @click="dropzoneClick()"
      >
        Upload or drop spec file
      </button>
      <input
        ref="fileInput"
        accept=".json, .yaml, .yml"
        style="position: absolute; visibility: hidden;"
        type="file"
        @change="fileUploaded"
      >
      <SettingsModal
        v-model:allow-content-scrolling="allowContentScrolling"
        v-model:allow-custom-server-url="allowCustomServerUrl"
        v-model:hide-deprecated="hideDeprecated"
        v-model:hide-schemas="hideSchemas"
        v-model:hide-try-it="hideTryIt"
        v-model:markdown-styles="markdownStyles"
      />
    </header>
    <splitpanes class="spec-container default-theme">
      <pane
        max-size="70"
        min-size="10"
      >
        <Editor
          v-model:value="code"
          :language="editorLanguage"
          :options="MONACO_EDITOR_OPTIONS"
          theme="vs-dark"
          @mount="handleMount"
        />
      </pane>
      <pane class="spec-renderer-pane">
        <SpecRenderer
          :allow-content-scrolling="allowContentScrolling"
          :allow-custom-server-url="allowCustomServerUrl"
          base-path="/spec-renderer"
          class="spec-renderer"
          :control-address-bar="true"
          document-scrolling-container=".spec-renderer-pane"
          :hide-deprecated="hideDeprecated"
          :hide-schemas="hideSchemas"
          :hide-try-it="hideTryIt"
          :markdown-styles="markdownStyles"
          :spec="specText"
        />
      </pane>
    </splitpanes>
    <DropzoneModal v-if="isOverDropZone" />
  </div>
</template>

<script setup lang="ts">
import '@kong/spec-renderer-dev/dist/style.css'
import 'splitpanes/dist/splitpanes.css'
import { ref, shallowRef, useTemplateRef } from 'vue'
import { refDebounced, useDropZone } from '@vueuse/core'
import type { VueMonacoEditorEmitsOptions } from '@guolao/vue-monaco-editor'
import { Editor } from '@guolao/vue-monaco-editor'
import { Splitpanes, Pane } from 'splitpanes'
import DropzoneModal from '../components/DropzoneModal.vue'
import SettingsModal from '../components/SettingsModal.vue'
import SpecRenderer from '../../src/components/SpecRenderer.vue'
import SelectDropdown from '../../src/components/common/SelectDropdown.vue'
import sampleSpec from '../sample-spec.json'

const MONACO_EDITOR_OPTIONS = {
  theme: 'vs-dark',
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  minimap: { enabled: false },
}

const editorLanguage = ref('json')
const code = ref(JSON.stringify(sampleSpec, null, 2))
const specText = refDebounced(code, 700)
const editor = shallowRef()

const dropZoneRef = useTemplateRef('dropzone')
const fileInputRef = useTemplateRef('fileInput')

const hideSchemas = ref<boolean>(false)
const hideDeprecated = ref<boolean>(false)
const hideTryIt = ref<boolean>(false)
const allowContentScrolling = ref<boolean>(true)
const markdownStyles = ref<boolean>(true)
const allowCustomServerUrl = ref<boolean>(true)

const updateLanguage = () => {
  if (code.value.length < 1) return

  // simplest hack to detect if we have JSON or YAML
  if (code.value.startsWith('{') || code.value.startsWith('[')) {
    editorLanguage.value = 'json'
  } else {
    editorLanguage.value = 'yaml'
  }
}

const handleMount: VueMonacoEditorEmitsOptions['mount'] = (editorInstance) => {
  editor.value = editorInstance

  // auto-detect language when new code is pasted
  editor.value.onDidPaste(updateLanguage)
}

const dropzoneClick = () => {
  fileInputRef.value?.click()
}

const fileUploaded = () => {
  const file = fileInputRef.value?.files?.item(0)
  if (file) {
    onDrop([file])
  }
}

function onDrop(files: File[] | null) {
  const file = files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = (e) => {
      if (e.target?.result) {
        code.value = e.target.result.toString()
        updateLanguage()
      }
    }
  }
}

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  dataTypes: ['application/x-yaml', 'application/json'],
  multiple: false,
  // whether to prevent default behavior for unhandled events
  preventDefaultForUnhandled: false,
})
</script>

<style lang="scss" scoped>
.spec-renderer-playground {
  font-family: 'Inter', Helvetica, Arial, sans-serif;
  $header-height: $kui-space-120;

  * {
    box-sizing: border-box;
    margin: 0;
  }

  header {
    align-items: center;
    background-color: $kui-color-background-neutral;
    color: $kui-color-text-inverse;
    display: flex;
    gap: $kui-space-100;
    height: $header-height;
    padding: $kui-space-20 $kui-space-40;

    h1 {
      font-size: $kui-font-size-80;
      line-height: $kui-line-height-60;
    }

    .language-selector {
      :deep(.trigger-button) {
        border: $kui-border-width-10 solid $kui-color-border;
        color: $kui-color-text-inverse;
        font-family: $kui-font-family-code;
        font-size: $kui-font-size-20;
        line-height: $kui-line-height-20;
        padding: $kui-space-20 $kui-space-30;
      }
    }

    .upload-spec-file {
      @include default-button-reset;
      background-color: $kui-color-background-transparent;
      border: $kui-border-width-10 solid $kui-color-border;
      border-radius: $kui-border-radius-20;
      color: $kui-color-text-inverse;
      cursor: pointer;
      font-size: $kui-font-size-30;
      padding: $kui-space-20 $kui-space-40;
      transition: background-color 0.2s ease-in-out,
        color 0.2s ease-in-out,
        border-color 0.2s ease-in-out;

      &:hover:not(:disabled):not(:focus):not(:active) {
        background-color: $kui-color-background-primary-weakest;
        color: $kui-color-text-primary-stronger;
      }
    }
  }

  .spec-container.default-theme {
    height: calc(100dvh - $header-height);
    width: 100dvw;

    .splitpanes__pane {
      background-color: $kui-color-background-transparent;
      overflow: auto;
    }

    .splitpanes__splitter {background-color: #ccc;position: relative;}
    .splitpanes__splitter:before {
      background-color: rgba(255, 0, 0, 0.3);
      content: '';
      left: 0;
      opacity: 0;
      position: absolute;
      top: 0;
      transition: opacity 0.4s;
      z-index: 1;
    }
    .splitpanes__splitter:hover:before {opacity: 1;}
    .splitpanes--vertical > .splitpanes__splitter:before {height: 100%;left: -30px;right: -30px;}
    .splitpanes--horizontal > .splitpanes__splitter:before {bottom: -30px;top: -30px;width: 100%;}
  }
}
</style>
