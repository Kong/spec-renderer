import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createHighlighterCore } = vi.hoisted(() => ({ createHighlighterCore: vi.fn() }))

vi.mock('shiki/core', () => ({ createHighlighterCore }))
vi.mock('shiki/engine/oniguruma', () => ({ createOnigurumaEngine: vi.fn(() => ({})) }))

describe('useShiki', () => {
  beforeEach(() => {
    vi.resetModules()
    createHighlighterCore.mockReset()
  })

  it('shares initialization between concurrent consumers', async () => {
    const highlighter = { codeToHtml: vi.fn() }
    let resolveHighlighter: (value: typeof highlighter) => void = () => undefined
    createHighlighterCore.mockReturnValue(new Promise(resolve => {
      resolveHighlighter = resolve
    }))

    const { default: useShiki } = await import('./useShiki')
    const firstCreation = useShiki().createHighlighter()
    const second = useShiki()
    const secondCreation = second.createHighlighter()

    expect(createHighlighterCore).toHaveBeenCalledTimes(1)
    resolveHighlighter(highlighter)
    await Promise.all([firstCreation, secondCreation])
    expect(second.highlighter.value?.codeToHtml).toBe(highlighter.codeToHtml)
  })

  it('allows initialization to retry after a failure', async () => {
    const highlighter = { codeToHtml: vi.fn() }
    createHighlighterCore.mockRejectedValueOnce(new Error('loading failed')).mockResolvedValueOnce(highlighter)

    const { default: useShiki } = await import('./useShiki')
    const shiki = useShiki()
    await expect(shiki.createHighlighter()).rejects.toThrow('loading failed')
    await expect(shiki.createHighlighter()).resolves.toBeUndefined()
    expect(createHighlighterCore).toHaveBeenCalledTimes(2)
  })
})
