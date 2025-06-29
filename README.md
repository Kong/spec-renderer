# Kong Spec Renderer

Kong's open-source spec renderer.

An online API specification editor is available at [api-documentation.dev](https://api-documentation.dev), and you can view the extended usage example [in the source repository](https://github.com/Kong/spec-editor).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Vue 3 Component(s)](#vue-3-components)
  - [Vue 3 Plugin](#vue-3-plugin)
  - [No/Other framework via native web components](#noother-framework-via-native-web-components)
    - [Example for react](#-example-for-react)
    - [Example for html/script](#-example-for-htmlscript)
  - [Props](#props)
    - [v-model](#v-model)
- [Contributing & Local Development](#contributing--local-development)
  - [Development Sandbox](#development-sandbox)
    - [Build and Preview the Development Sandbox](#build-and-preview-the-development-sandbox)
  - [Lint and fix](#lint-and-fix)
  - [Testing](#testing)
  - [Build for production](#build-for-production)
  - [Committing Changes](#committing-changes)
    - [Enforcing Commit Format](#enforcing-commit-format)
  - [Approvals](#approvals)
  - [Package Publishing](#package-publishing)
- [Third-party packages and Thank You](#third-party-packages-and-thank-you)

## Installation

Install the `@kong/spec-renderer` package in your host project.

```sh
pnpm add @kong/spec-renderer
```

## Usage

### Vue 3 Component(s)

Import the package and the component(s) you wish to use.

```ts
<template>
  <SpecDocument
    :spec="spec"
  />
</template>

<script setup lang="ts">
import { SpecDocument } from '@kong/spec-renderer'
const spec= `openapi: 3.1.0
info:
  title: Beer API
  description: API for managing beers
  version: 1.0.0
...`
</scirpt>

```

### Vue 3 Plugin

Import the package (and TypeScript types, if desired) inside of your App's entry file (e.g. for Vue, `main.ts`). Set the plugin options, and tell Vue to use the plugin.

```js
// main.ts

import App from './App.vue'
import KongSpecRendererPlugin from '@kong/spec-renderer'
import '@kong/spec-renderer/dist/style.css'

const app = createApp(App)

// Register the plugin
app.use(KongSpecRendererPlugin)

app.mount('#app')
```

Now that the plugin is globally registered, simply include a component just like you would any other Vue component, utilizing any props as needed

This is to renderer KongSpecRender component

```vue
<template>
  <KongSpecRenderer
    :spec="specification-content-to-present"
  />
</template>
```

This is to renderer Toc and Document  components separately

```vue
<template>
  <div id="kong-spec-renderer-wrapper">
    <nav>
      <KongSpecRendererToc
        :table-of-contents="tableOfContents.value"
      />
    </nav>
    <main>
      <KongSpecRendererDocument
        :document="parsedDocument.value"
        current-path="/"
      />
    </main>
  </div>
</template>
<script setup lang="ts">
  import { onBeforeMount } from 'vue'
  import { parseSpecDocument, parsedDocument, tableOfContents } from '@kong/spec-renderer'

  onBeforeMount(() => async {
    await parseSpecDocument()
  }
</script>
```

This is to renderer SchemaRenderer component

```vue
<template>
  <KongSchemaRenderer
    :schema="mySchema"
  />
</template>
<script setup lang="ts">
  import { SchemaObject } from '@kong/spec-renderer'

  const mySchema: SchemaObject = {
    type: 'object',
    title: 'Person',
    properties: {
      name: {
        type: 'string',
      },
    },
  }
</script>
```

### No/Other framework via native web components

Import the package and call the provided `registerSpecRenderer` function.

#### - Example for react

```jsx
// IMPORTANT: we are importing from the web-component bundle
import { registerKongSpecRenderer, parseSpecDocument, parsedDocument, tableOfContents }  from '@kong/spec-renderer/web-component'

// Call the registration function to automatically register all spec-renderer custom elements for usage
registerKongSpecRenderer()

// this is to renderer spec-renderer as one single component
const singleComponent = () => (
    <kong-spec-renderer
      spec="openapi: 3.1.0 ..."
    />
)

// this is to renderer toc and document separately
const tocAndDocComponents = async () => {

  await parseSpecDocument(spec, {webComponentSafe: true})

  return (
    <div id="kong-spec-renderer-wrapper">
      <nav>
        <kong-spec-renderer-toc
          table-of-contents={tableOfContents.value}
        />
      </nav>
      <main>
        <kong-spec-renderer-document
          document={parsedDocument.value}
          current-path="/"
        />
      </main>
    </div>
  )
}

```

#### - Example for html/script

```html
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet">
    <style>
    body { font-family: 'Inter', Roboto, Helvetica, sans-serif; }
    </style>
  </head>
  <body>
    <kong-spec-renderer
      spec-url="https://raw.githubusercontent.com/Kong/spec-renderer/refs/heads/main/sandbox/public/specs/beer-and-coffee.yaml"
      navigation-type="hash"
      hide-insomnia-try-it="true"
    />

    <script type="module">
    import { registerKongSpecRenderer } from 'https://cdn.jsdelivr.net/npm/@kong/spec-renderer@^1/dist/kong-spec-renderer.web-component.es.js'
    registerKongSpecRenderer()
    </script>
  </body>
</html>
```

As of now only `SpecRenderer` as single component is supported for this. Let us know if support for individual `SpecRendererToc`, `SpeRendererDocument` and `SchemaRenderer` is needed.


### Props

[Check out the `SpecRendererProps` interface](./src/types/spec-renderer.ts) for all props valid for the `SpecRenderer` component.

## Contributing & Local Development

To get started, install the package dependencies

```sh
pnpm install
```

### Development Sandbox

This repository includes a Vue sandbox app (see the `/sandbox` directory) to allow you to experiment with components.

#### Build and Preview the Development Sandbox

To build and run a local preview of the Sandbox:

```sh
pnpm run preview
```

### Lint and fix

Lint package files, and optionally auto-fix detected issues.

```sh
# Stylelint only
pnpm run stylelint

# Stylelint and fix
pnpm run stylelint:fix

# ESLint only
pnpm run lint

# ESLint and fix
pnpm run lint:fix
```

### Testing

Unit and component tests are run with [Vitest](https://vitest.dev/).

```sh
# Run tests
pnpm run test

# Run tests in the Vitest UI
pnpm run test:open
```

### Build for production

```sh
pnpm run build
```

### Committing Changes

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

This repo uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

[Commitizen](https://github.com/commitizen/cz-cli) and [Commitlint](https://github.com/conventional-changelog/commitlint) are used to help build and enforce commit messages.

It is **highly recommended** to use the following command in order to create your commits:

```sh
pnpm run commit
```

This will trigger the Commitizen interactive prompt for building your commit message.

#### Enforcing Commit Format

[Lefthook](https://github.com/evilmartians/lefthook) is used to manage Git Hooks within the repo.

- A `commit-msg` hook is automatically setup that enforces commit message stands with `commitlint`, see [`lefthook.ymal`](./lefthook.yaml)
- A `pre-push` hook is used that runs `eslint` before allowing you to push your changes to the repository

Additionally, CI will use `commitlint` to validate the commits associated with a PR in the `Lint and Validate` job.

### Approvals

- All pull requests require review and approval from authorized team members.
- Automated approvals through workflows are strictly prohibited.
  - There is an exception for automated pull request approvals originating from generated dependency updates that satisfy status checks and other requirements.
- Protected branches require at least one approval from code owners.
- All status checks must pass before a pull request may be merged.

### Package Publishing

This repository utilizes [Semantic Release](https://github.com/semantic-release/semantic-release) for automated package publishing and version updates.

## Third-party packages and Thank You

- Thank You [Stoplight](https://stoplight.io/) for beautiful parser and AST producer [stoplight/http-spec](https://github.com/stoplightio/http-spec).

- Thank You [Stoplight](https://stoplight.io/) for excellent approach for dealing with specification's table of contents and specification's  security definitions. Found in [elements](https://github.com/stoplightio/elements) and currently placed into [src/stoplight](src/stoplight/), while [PR](https://github.com/stoplightio/elements/pull/2751) back to elements package pending.

- Thank You [AsyncApi](https://www.asyncapi.com/) for superb [@asyncapi/parser](https://github.com/asyncapi/parser-js).
