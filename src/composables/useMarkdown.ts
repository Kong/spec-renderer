import { ref } from 'vue'
import markdownit from 'markdown-it'
import type MarkdownIt from 'markdown-it'

const md = ref<MarkdownIt>()

export default function useMarkdown() {

  function initializeMarkdown() {
    if (!md.value) {
      md.value = markdownit('commonmark', {
        html: false, // Keep disabled to prevent XSS
        xhtmlOut: true, // Use '/' to close single tags (<br />)
        breaks: true, // Convert '\n' in paragraphs into <br>
        typographer: true, // Enable some language-neutral replacement + quotes beautification
      })
    }
  }

  function mdRender(text: string): string {
    initializeMarkdown()
    return md.value?.render(text) || text
  }

  return {
    mdRender,
  }
}
