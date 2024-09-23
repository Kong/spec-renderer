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
  - [Vue 2 or no framework via native web components](#vue-2-or-no-framework-via-native-web-components)
  - [Options](#options)
  - [Events](#events)
- [Contributing \& Local Development](#contributing--local-development)
  - [Development Sandbox](#development-sandbox)
  - [Lint and fix](#lint-and-fix)
  - [Testing](#testing)
  - [Build for production](#build-for-production)
  - [Committing Changes](#committing-changes)
  - [Package Publishing](#package-publishing)

## Installation

Install the `@kong/spec-renderer` package in your host project.

```sh
pnpm add @kong/spec-renderer

# OR

yarn add @kong/spec-renderer
```

## Usage

### Vue 3 Component(s)

Import the package (and TypeScript types, if desired) inside of your App's entry file (e.g. for Vue, `main.ts`). Set the plugin options, and tell Vue to use the plugin.

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
import type { KongSpecRendererOptions } from '@kong/spec-renderer-dev'
import '@kong/spec-renderer-dev/dist/style.css'

const app = createApp(App)

const pluginOptions: KongSpecRendererOptions = {
  shadowDom: false, // We are using the Vue plugin, so the shadow DOM isn't needed
}

// Register the plugin
app.use(KongSpecRendererPlugin, pluginOptions)

app.mount('#app')
```

Now that the plugin is globally registered, simply include a component just like you would any other Vue component, utilizing any props as needed

```html
<KongSpecRenderer
  :spec="specification-content-to-present"
/>
```

---

### Vue 2 or no framework via native web components

Import the package (and TypeScript types, if desired) inside of your App's entry file (e.g. for Vue, `main.ts`), set up the options, and call the provided `registerKongAuthNativeElements` function.

```ts
// main.ts

import registerSpecRenderer from '@kong/spec-renderer-dev/vue'
import type { KongSpecRendererOptions } from '@kong/spec-renderer-dev'
import '@kong/spec-renderer-dev/dist/style.css'

const options: KongAuthElementsOptions = {
  shadowDom: true,
  injectCss: ['.kong-spec-renderer .k-input#email { background-color: #ff0000 }'],
}

// Call the registration function to automatically register all spec-renderer custom elements for usage
registerSpecRenderer(options)
```

The function will register all custom elements for usage as native web components.

Wherever you want to utilze a custom element, [you **must** wrap it with an element](#teleport-wrapper) (e.g. a `div`) with a unique `id` attribute, and then simply include the element in your HTML just like you would any other element, utilizing any props as needed

```html
<div id="kong-spec-renderer-wrapper">
  <kong-spec-renderer
    :spec="openapi: 3.1.0 ..."
  kong-spec-renderer>
</div>
```

#### Teleport Wrapper

For the current implementation, it is **REQUIRED** to wrap the element with a tag with a unique `id` attribute so the custom element can be "teleported" out of the shadow DOM to enable password manager support.

The `id` attribute should then be passed to each [Custom Element](#custom-elements) in the `wrapperId` prop so the element can be properly teleported out of the shadow DOM. For more information [refer to the Vue Teleport docs](https://vuejs.org/guide/built-ins/teleport.html). There are default `wrapperId` prop values provided; however to utilize them you still must wrap the custom element in an element with the corresponding `id`.

---


### Options

#### `v-model`

- type: `String`
- required: `false`
- default: `''`

### Events

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

### Package Publishing

This repository utilizes [Semantic Release](https://github.com/semantic-release/semantic-release) for automated package publishing and version updates.
