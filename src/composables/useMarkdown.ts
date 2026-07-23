import markdownit from 'markdown-it'
import type MarkdownIt from 'markdown-it'
import { sanitizeMarkdownHtml } from '@/utils/html-sanitizer'

let md: MarkdownIt | null

export default function useMarkdown() {

  function initializeMarkdown() {
    if (!md) {
      md = markdownit({
        html: true, // enabled to allow raw HTML in source
        xhtmlOut: true, // Use '/' to close single tags (<br />)
        linkify: true, // Convert URL-like text to links
        breaks: true, // Convert '\n' in paragraphs into <br>
        typographer: true, // Enable some language-neutral replacement + quotes beautification
      })
    }
  }

  function mdRender(text: string): string {
    if (!String(text || '').trim()) {
      return ''
    }
    initializeMarkdown()
    try {
      const renderedText = md?.render(text) || text
      return sanitizeMarkdownHtml(renderedText)
    } catch {
      return sanitizeMarkdownHtml(text)
    }
  }

  return {
    mdRender,
  }
}
