<template>
  <div class="sandbox-container">
    <main>
      <div class="page-header">
        <h1><code>@kong/spec-renderer</code></h1>
        <a
          href="https://github.com/Kong/spec-renderer"
          target="_blank"
        >GitHub Docs</a>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.sandbox-container {
  background: $kui-color-background;
  color: $kui-color-text;
  font-family: $kui-font-family-text;
  padding: var(--kui-space-70, $kui-space-70);
}

.page-header {
  align-items: baseline;
  gap: $kui-space-70;
  margin-bottom: $kui-space-70;

  @media (min-width: $kui-breakpoint-mobile) {
    display: flex;
  }

  h1 {
    margin-bottom: $kui-space-20;
    margin-top: $kui-space-0;

    @media (min-width: $kui-breakpoint-mobile) {
      margin-bottom: $kui-space-0;
    }
  }

  a {
    color: $kui-color-text-primary;
    display: inline-block;
    text-decoration: none;

    &:hover {
      color: $kui-color-text-primary-stronger;
    }

    &:active {
      color: $kui-color-text-primary-strongest;
    }
  }
}
</style>
