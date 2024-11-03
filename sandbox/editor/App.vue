<template>
  <div class="app">
    <header>
      <h1>Kong Spec Renderer</h1>
      <SelectDropdown
        v-model="editorLanguage"
        class="language-selector"
        :items="[{ label: 'JSON', value: 'json' }, { label: 'YAML', value: 'yaml' }]"
      />
      <button
        class="upload-spec-file"
        type="button"
        @click="() => open()"
      >
        Upload spec file
      </button>
    </header>
    <main class="spec-container">
      <Editor
        v-model:value="code"
        :language="editorLanguage"
        :options="MONACO_EDITOR_OPTIONS"
        theme="vs-dark"
        @mount="handleMount"
      />
      <SpecRenderer
        class="spec-renderer"
        :control-address-bar="true"
        document-scrolling-container=".spec-renderer-wrapper"
        :markdown-styles="true"
        :spec="specText"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import '@kong/spec-renderer-dev/dist/style.css'
import { useFileDialog } from '@vueuse/core'
import type { VueMonacoEditorEmitsOptions } from '@guolao/vue-monaco-editor'
import { Editor } from '@guolao/vue-monaco-editor'
import { ref, shallowRef } from 'vue'
import { refDebounced } from '@vueuse/core'
import SpecRenderer from '../../src/components/SpecRenderer.vue'
import SelectDropdown from '../../src/components/common/SelectDropdown.vue'
import sampleSpec from './sample.json'

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

const updateLanguage = () => {
  if (code.value.length < 1) return

  // simplest hack to detect if we have JSON or YAML
  if (editorLanguage.value !== 'json' && (code.value.startsWith('{') || code.value.startsWith('['))) {
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

const { open, onChange } = useFileDialog({
  accept: 'yml, yaml, json',
  multiple: false,
})

onChange((list) => {
  const file = list?.[0]

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
  /** do something with files */
})
</script>

<style lang="scss" scoped>
.app {
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

  main {
    display: flex;
    height: calc(100dvh - $header-height);
    width: 100dvw;
    .spec-renderer {
      overflow: scroll;
    }
  }
}
</style>
