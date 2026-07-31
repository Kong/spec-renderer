import { describe, expect, it } from 'vitest'
import { sanitizeCodeBlockHtml, sanitizeHref, sanitizeMailtoHref, sanitizeMarkdownHtml } from './html-sanitizer'

describe('html-sanitizer', () => {
  it('sanitizes code block HTML with a narrow allowlist', () => {
    const sanitized = sanitizeCodeBlockHtml('<pre class="shiki" data-line="1" style="background:#fff"><code><span class="line" style="color:#000" onclick="alert(1)">ok</span></code></pre><img src=x>')

    expect(sanitized).toBe('<pre class="shiki" style="background:#fff"><code><span class="line" style="color:#000">ok</span></code></pre>')
  })

  it('preserves the Shiki tags and attributes used by code blocks', () => {
    const html = [
      '<pre class="shiki shiki-themes catppuccin-latte catppuccin-mocha" style="background-color:var(--kui-color-background-neutral-weakest, #f9fafb);--shiki-dark-bg:var(--kui-color-background-neutral-weakest, #232633);color:#4c4f69;--shiki-dark:#cdd6f4" tabindex="0">',
      '<code><span class="line">',
      '<span style="color:#1E66F5;--shiki-light-font-style:italic;--shiki-dark:#89B4FA;--shiki-dark-font-style:italic">curl</span>',
      '<span style="color:#4C4F69;--shiki-dark:#CDD6F4"> --request GET \\</span>',
      '</span></code></pre>',
    ].join('')

    const sanitized = sanitizeCodeBlockHtml(html)

    expect(sanitized).toBe([
      '<pre class="shiki shiki-themes catppuccin-latte catppuccin-mocha" style="background-color:var(--kui-color-background-neutral-weakest, #f9fafb);--shiki-dark-bg:var(--kui-color-background-neutral-weakest, #232633);color:#4c4f69;--shiki-dark:#cdd6f4">',
      '<code><span class="line">',
      '<span style="color:#1E66F5;--shiki-light-font-style:italic;--shiki-dark:#89B4FA;--shiki-dark-font-style:italic">curl</span>',
      '<span style="color:#4C4F69;--shiki-dark:#CDD6F4"> --request GET \\</span>',
      '</span></code></pre>',
    ].join(''))
  })

  it('preserves local masking markup injected into Shiki tokens', () => {
    const sanitized = sanitizeCodeBlockHtml('<pre class="shiki" style="color:#000"><code><span class="line"><span style="color:#40A02B">\'X-API-Key: <span class="sensitive-masked">••••••</span>\'</span></span></code></pre>')

    expect(sanitized).toBe('<pre class="shiki" style="color:#000"><code><span class="line"><span style="color:#40A02B">\'X-API-Key: <span class="sensitive-masked">••••••</span>\'</span></span></code></pre>')
  })

  it('preserves line breaks used in code block error messages', () => {
    const sanitized = sanitizeCodeBlockHtml("Invalid URL value 'hostname/api/v3/path'<br/> - missing protocol")

    expect(sanitized).toBe("Invalid URL value 'hostname/api/v3/path'<br /> - missing protocol")
  })

  it('strips transformer-style metadata that is not part of the current code block renderer', () => {
    const sanitized = sanitizeCodeBlockHtml('<pre class="shiki has-diff"><code><span class="line diff add" data-line="1"><span data-token="token:1:1">ok</span></span></code></pre>')

    expect(sanitized).toBe('<pre class="shiki has-diff"><code><span class="line diff add"><span>ok</span></span></code></pre>')
  })

  it('returns an empty string for empty HTML', () => {
    expect(sanitizeCodeBlockHtml('')).toBe('')
    expect(sanitizeMarkdownHtml('')).toBe('')
  })

  it('sanitizes markdown HTML while preserving markdown-specific tags', () => {
    const sanitized = sanitizeMarkdownHtml('<details open><summary>More</summary><img src="https://example.com/a.png" onerror="alert(1)" /></details><script>alert(1)</script>')

    expect(sanitized).toBe('<details><summary>More</summary><img src="https://example.com/a.png" /></details>')
  })

  it('strips code-block-only attributes from markdown HTML', () => {
    const sanitized = sanitizeMarkdownHtml('<p class="copy" style="color:red">Text</p><a href="https://example.com" style="color:red">Link</a>')

    expect(sanitized).toBe('<p>Text</p><a href="https://example.com">Link</a>')
  })

  it('allows safe HTTP hrefs and relative hrefs', () => {
    expect(sanitizeHref('https://example.com/docs')).toBe('https://example.com/docs')
    expect(sanitizeHref('http://example.com/docs')).toBe('http://example.com/docs')
    expect(sanitizeHref('/docs')).toBe('/docs')
    expect(sanitizeHref('//example.com/docs')).toBe('//example.com/docs')
  })

  it('blocks hrefs with unsafe protocols', () => {
    expect(sanitizeHref('javascript:alert(1)')).toBeUndefined()
    expect(sanitizeHref('data:text/html,<script>alert(1)</script>')).toBeUndefined()
    expect(sanitizeHref('mailto:user@example.com')).toBeUndefined()
  })

  it('builds mailto hrefs from email addresses', () => {
    expect(sanitizeMailtoHref('user@example.com')).toBe('mailto:user@example.com')
    expect(sanitizeMailtoHref(' user+docs@example.com ')).toBe('mailto:user+docs@example.com')
  })

  it('blocks malformed mailto values', () => {
    expect(sanitizeMailtoHref('javascript:alert(1)')).toBeUndefined()
    expect(sanitizeMailtoHref('user@example.com?subject=Injected')).toBeUndefined()
    expect(sanitizeMailtoHref('user@example.com%0D%0ABcc:attacker@example.com')).toBeUndefined()
  })
})
