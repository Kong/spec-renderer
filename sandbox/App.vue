<template>
  <div class="sandbox-container">
    <header class="page-header">
      <h1><code>@kong/spec-renderer</code></h1>
    </header>
    <main class="page-main">
      <router-view />
    </main>
  </div>
</template>

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
