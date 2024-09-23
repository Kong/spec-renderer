<template>
  <div class="kong-auth-element">
    <div
      v-if="injectedStyles"
      data-testid="kong-spec-renderer-injected-styles"
    >
      <!-- This injected styles tag, the parent tag, and its corresponding logic in the setup function must be present to import styles from child components. -->
      <!-- eslint-disable vue/no-v-html -->
      <div v-html="injectedStyles" />
      <!-- eslint-enable vue/no-v-html -->
    </div>

    <slot name="default" />
  </div>
</template>

<script setup lang="ts">
import useInjectStyles from '@/composables/useInjectStyles'

// Must be present to inject child component styles for elements rendered inside of the <slot/>
const { injectedStyles } = useInjectStyles()
</script>

<style lang="scss">
/*! KONG_SPEC_RENDERER_INJECT_STYLES */
// Do not add the 'scoped' attribute to this <style> tag in this component.

// Import custom app styles from a single entrypoint
// (since this is wrapping all custom elements)
@import "@/styles/styles";
</style>
