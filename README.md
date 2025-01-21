# Kong Spec Renderer

> [!IMPORTANT]
> This repository and the `@kong/spec-renderer-dev` package are currently in development on the `main` branch. Breaking changes should be expected.
>
> Once the `1.x` version is ready, the package name will change to `@kong/spec-renderer`.

Kong's open-source spec renderer.

Url for sandbox https://kong.github.io/spec-renderer (deployed from main branch)

- [Installation](#installation)
- [Usage](#usage)
  - [Vue 3 Component(s)](#vue-3-components)
  - [Vue 3 Plugin](#vue-3-plugin)
  - [No/Other framework via native web components](#noother-framework-via-native-web-components)
  - [Props](#props)
- [Contributing \& Local Development](#contributing--local-development)
  - [Development Sandbox](#development-sandbox)
  - [Lint and fix](#lint-and-fix)
  - [Testing](#testing)
  - [Build for production](#build-for-production)
  - [Committing Changes](#committing-changes)
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
import { SpecDocument } from '@kong/spec-renderer-dev'
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
import KongSpecRendererPlugin from '@kong/spec-renderer-dev'
import '@kong/spec-renderer-dev/dist/style.css'

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
  import { parseSpecDocument, parsedDocument, tableOfContents } from '@kong/spec-renderer-dev'

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
  import { SchemaObject } from '@kong/spec-renderer-dev'

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
import { registerKongSpecRenderer, parseSpecDocument, parsedDocument, tableOfContents }  from '@kong/spec-renderer-dev/web-component'

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
<html>
  <head>
    <script src="./lib/kong-spec-renderer.web-component.umd.js"></script>
  </head>
  <body>
     <kong-spec-renderer
      spec="openapi: 3.1.0 ..."
    />
  </body>
</html>
```

As of now only `SpecRenderer` as single component is supported for this. Let us know if support for individual `SpecRendererToc`, `SpeRendererDocument` and `SchemaRenderer` is needed.


### Props

#### `v-model`

- type: `String`
- required: `false`
- default: `''`

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

- Thank You [Stoplight](https://stoplight.io/) for excellent approach for dealing with specification's table of contents and specification's  security definitions. Found in [elements](https://github.com/stoplightio/elements) and currently placed into [src/stoplight](src/stoplight/), while [PR]() back to elements package pending.

- Thank You [AsyncApi](https://www.asyncapi.com/) for superb [@asyncapi/parser](https://github.com/asyncapi/parser-js).
