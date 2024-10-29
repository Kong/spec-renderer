<template>
  <div class="app">
    <header>
      <h1>Kong Spec Renderer</h1>
      <SelectDropdown
        v-model="editorLanguage"
        class="language-selector"
        :items="[{ label: 'JSON', value: 'json' }, { label: 'YAML', value: 'yaml' }]"
      />
    </header>
    <main>
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
        :markdown-styles="true"
        :spec="specText"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import '@kong/spec-renderer-dev/dist/style.css'
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
const handleMount: VueMonacoEditorEmitsOptions['mount'] = (editorInstance) => {
  editor.value = editorInstance

  // auto-detect language when new code is pasted
  editor.value.onDidPaste(() => {
    if (code.value.length > 0) {
      if (editorLanguage.value !== 'json' && (code.value.startsWith('{') || code.value.startsWith('['))) {
        editorLanguage.value = 'json'
      } else {
        editorLanguage.value = 'yaml'
      }
    }
  })
}
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
        border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
        color: $kui-color-text-inverse;
        font-family: var(--kui-font-family-code, $kui-font-family-code);
        font-size: var(--kui-font-size-20, $kui-font-size-20);
        line-height: var(--kui-line-height-20, $kui-line-height-20);
        padding: var(--kui-space-20, $kui-space-20) var(--kui-space-30, $kui-space-30);

        @media (min-width: $kui-breakpoint-mobile) {
          padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
        }
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
