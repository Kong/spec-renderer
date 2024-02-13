# Kong Spec Renderer

> [!IMPORTANT]
> This repository and the `@kong/spec-renderer-poc` package are currently in development on the `main` branch. Breaking changes should be expected.
>
> Once the `1.x` version is ready, the package name will change to `@kong/spec-renderer`.

Kong's open-source spec renderer.

- [Usage](#usage)
  - [Installation](#installation)
  - [Props](#props)
- [Contributing \& Local Development](#contributing--local-development)
  - [Development Sandbox](#development-sandbox)
  - [Lint and fix](#lint-and-fix)
  - [Testing](#testing)
  - [Build for production](#build-for-production)
  - [Committing Changes](#committing-changes)
  - [Package Publishing](#package-publishing)

## Usage

### Installation

Install the `@kong/spec-renderer` package in your host project.

```sh
pnpm add @kong/spec-renderer

# OR

yarn add @kong/spec-renderer
```

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

### Package Publishing

This repository utilizes [Semantic Release](https://github.com/semantic-release/semantic-release) for automated package publishing and version updates.
