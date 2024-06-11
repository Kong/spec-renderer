<template>
  <div>
    <!-- eslint-disable vue/no-v-html -->
    <div
      class="code-block"
      v-html="code"
    />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>

<script setup lang="ts">
defineProps({
  code: {
    type: String,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
:deep(pre) {
  margin: 0;
  padding: var(--kui-space-40, $kui-space-40);
  white-space: pre-wrap;

  code {
    background: transparent !important;
    padding: var(--kui-space-0, $kui-space-0);
  }
}
</style>