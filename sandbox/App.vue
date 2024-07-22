<template>
  <div class="sandbox-container">
    <header class="page-header">
      <h1><code>@kong/spec-renderer-dev</code></h1>
      <div>
        <router-link
          to="/"
        >
          Kong Spec-Renderer
        </router-link>
        <a href="/spec-renderer/stoplight/">
          Stoplight-Playground
        </a>
      </div>

      <SandboxSpecSettings
        @show-schemas-change="hideSchemas = !$event"
        @show-try-it-change="hideTryIt = !$event"
        @spec-text-change="specText = $event"
        @spec-url-change="specUrl = $event"
      />
    </header>
    <main class="page-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue'
import SandboxSpecSettings from './components/SandboxSpecSettings.vue'

const specUrl = ref<string>('')
const specText = ref<string>('')
const hideSchemas = ref<boolean>(false)
const hideTryIt = ref<boolean>(false)

provide('spec-url', specUrl)
provide('spec-text', specText)
provide('hide-schemas', hideSchemas)
provide('hide-try-it', hideTryIt)
</script>

<style lang="scss" scoped>
.sandbox-container {
  font-family: $kui-font-family-text;
}

.page-header {
  background-color: $kui-color-background-primary-strongest;
  color: $kui-color-text-inverse;
  gap: $kui-space-70;
  display: flex;
  flex-direction: column;

  @media (min-width: $kui-breakpoint-mobile) {
    align-items: center;
    flex-direction: row;
  }

  h1 {
    margin-bottom: $kui-space-20;
    margin-top: $kui-space-0;
    margin-left: $kui-space-40;
    font-size: $kui-font-size-40;

    @media (min-width: $kui-breakpoint-mobile) {
      margin-bottom: $kui-space-0;
    }
  }

  a {
    color: $kui-color-text-inverse;
    display: inline-block;
    text-decoration: none;
    padding: 10px;
    font-size: $kui-font-size-20;

    &.router-link-exact-active {
      color: $kui-color-text-primary-strongest;
      background-color: $kui-color-text-decorative-aqua;
    }
  }
}
</style>
