<template>
  <div class="sandbox-container">
    <header class="page-header">
      <h1><code>@kong/spec-renderer-dev</code></h1>
      <router-link
        to="/"
      >
        Kong Spec-Renderer
      </router-link>
      <a href="/spec-renderer/stoplight/">
        Stoplight-Playground
      </a>
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

.page-main {
  padding: 6px;
}
.page-header {
  background-color: $kui-color-background-primary-strongest;
  color: $kui-color-text-inverse;

  align-items: baseline;
  gap: $kui-space-70;
  margin-bottom: $kui-space-70;

  @media (min-width: $kui-breakpoint-mobile) {
    display: flex;
  }

  h1 {
    margin-bottom: $kui-space-20;
    margin-top: $kui-space-0;
    margin-left: $kui-space-40;

    @media (min-width: $kui-breakpoint-mobile) {
      margin-bottom: $kui-space-0;
    }
  }

  a {
    color: $kui-color-text-inverse;
    display: inline-block;
    text-decoration: none;
    padding: 10px;

    &:hover {
      //color: $kui-color-text-primary-stronger;
    }

    &.router-link-exact-active {
      color: $kui-color-text-primary-strongest;
      background-color: $kui-color-text-decorative-aqua;
    }
  }
}
</style>
