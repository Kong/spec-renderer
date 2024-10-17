import { ref } from 'vue'
import markdownit from 'markdown-it'
import type MarkdownIt from 'markdown-it'
import sanitize from 'sanitize-html'

const md = ref<MarkdownIt>()

export default function useMarkdown() {

  function initializeMarkdown() {
    if (!md.value) {
      md.value = markdownit({
        html: true, // enabled to allow raw HTML in source
        xhtmlOut: true, // Use '/' to close single tags (<br />)
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
      const renderedText = md.value?.render(text) || text
      return sanitize(renderedText, {
        allowedTags: sanitize.defaults.allowedTags.concat(['img', 'details']),
      })
    } catch (error) {
      return text
    }
  }

  return {
    mdRender,
  }
}
