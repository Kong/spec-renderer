import { afterEach, describe, expect, it, vi } from 'vitest'

const examples = [
  ['java', 'class Example { String greeting = "hello"; }'],
  ['javascript', 'const greeting = "hello"'],
  ['json', '{"greeting": "hello"}'],
  ['python', 'print("hello")'],
  ['go', 'package main\nfunc main() { println("hello") }'],
  ['ruby', 'puts "hello"'],
  ['fish', 'echo "hello"'],
  ['csharp', 'Console.WriteLine("hello");'],
] as const

describe('useShiki without WebAssembly', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('highlights every supported language with both themes', async () => {
    vi.stubGlobal('WebAssembly', undefined)

    const { default: useShiki } = await import('./useShiki')
    const { highlighter, createHighlighter } = useShiki()
    await createHighlighter()

    expect(highlighter.value).toBeDefined()

    for (const [lang, code] of examples) {
      for (const theme of ['catppuccin-latte', 'catppuccin-mocha']) {
        const result = highlighter.value!.codeToTokens(code, { lang, theme })

        expect(result.tokens.map(line => line.map(token => token.content).join('')).join('\n')).toBe(code)
        expect(new Set(result.tokens.flat().map(token => token.color)).size).toBeGreaterThan(1)
      }
    }
  })
})
