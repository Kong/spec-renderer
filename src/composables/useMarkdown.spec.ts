import { describe, it, expect } from 'vitest'
import useMarkdown from './useMarkdown'

describe('useMarkdown', () => {
  it('should render markdown', () => {
    const { mdRender } = useMarkdown()
    const rendered = mdRender('**bold**')
    expect(rendered).toEqual('<p><strong>bold</strong></p>\n')
  })
})
