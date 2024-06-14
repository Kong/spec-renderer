<template>
  <div
    class="spec-renderer-page-header"
    data-testid="spec-renderer-page-header"
  >
    <h1
      class="page-header-title"
      data-testid="spec-renderer-page-header-title"
    >
      {{ title }}
    </h1>
    <p
      v-if="description"
      class="page-header-description"
      data-testid="spec-renderer-page-header-description"
    >
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss" scoped>
.spec-renderer-page-header {
  .page-header-title {
    font-size: var(--kui-font-size-80, $kui-font-size-80);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    line-height: var(--kui-line-height-70, $kui-line-height-70);
  }
  .page-header-description {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    line-height: var(--kui-line-height-40, $kui-line-height-40);
  }

  > :not(:first-child) {
    margin-top: var(--kui-space-60, $kui-space-60);
  }
}
</style>
