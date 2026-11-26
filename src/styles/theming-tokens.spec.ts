import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const themingDocPath = join(srcDir, '..', 'docs', 'theming.md')
const themesDir = join(srcDir, '..', 'sandbox', 'themes')

const TOKEN_PATTERN = /--kui-spec-renderer-[a-z0-9-]+/g

const sourceFiles = (readdirSync(srcDir, { recursive: true }) as string[])
  .filter(file => /\.(vue|scss|ts)$/.test(file) && !file.endsWith('.spec.ts'))
  .map(file => readFileSync(join(srcDir, file), 'utf-8'))

const usedTokens = new Set(sourceFiles.flatMap(source => source.match(TOKEN_PATTERN) || []))

// the first column of the token tables in docs/theming.md
const documentedTokens = readFileSync(themingDocPath, 'utf-8')
  .split('\n')
  .map(line => line.match(/^\| `(--kui-spec-renderer-[a-z0-9-]+)` \|/)?.[1])
  .filter((token): token is string => !!token)

// every --kui-* custom property the renderer reads (spec renderer tokens and Kongponents tokens alike)
const READ_TOKEN_PATTERN = /--kui-[a-z0-9-]+/g
const readTokens = new Set(sourceFiles.flatMap(source => source.match(READ_TOKEN_PATTERN) || []))

const themeFiles = (readdirSync(themesDir) as string[])
  .filter(file => file.endsWith('.css'))
  .map(file => ({ name: file, content: readFileSync(join(themesDir, file), 'utf-8') }))

describe('spec renderer component tokens', () => {
  it('documents every token used in src in docs/theming.md', () => {
    expect([...usedTokens].filter(token => !documentedTokens.includes(token))).toEqual([])
  })

  it('only documents tokens that are used in src', () => {
    expect(documentedTokens.filter(token => !usedTokens.has(token))).toEqual([])
  })

  it('documents each token once', () => {
    expect(documentedTokens.filter((token, index) => documentedTokens.indexOf(token) !== index)).toEqual([])
  })

  it('always gives a token a fallback, so the default rendering does not depend on it being set', () => {
    const tokensWithoutFallback = sourceFiles.flatMap(source => source.match(/var\(--kui-spec-renderer-[a-z0-9-]+\)/g) || [])

    expect(tokensWithoutFallback).toEqual([])
  })

  it('only sets tokens in the sandbox themes that the renderer reads', () => {
    // catches typos, and tokens a theme sets that nothing in src consumes
    const unknownTokens = themeFiles.flatMap(({ name, content }) => {
      const setTokens = content.match(/--kui-[a-z0-9-]+(?=\s*:)/g) || []

      return setTokens.filter(token => !readTokens.has(token)).map(token => `${name}: ${token}`)
    })

    expect(unknownTokens).toEqual([])
  })
})
