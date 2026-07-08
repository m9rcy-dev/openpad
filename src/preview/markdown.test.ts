import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders headings, emphasis, and lists', () => {
    const html = renderMarkdown('# Title\n\nSome **bold** text\n\n- item one\n- item two')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<li>item one</li>')
  })

  it('renders fenced code blocks as escaped code', () => {
    const html = renderMarkdown('```\n<script>alert(1)</script>\n```')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('linkifies URLs', () => {
    const html = renderMarkdown('see https://example.com now')
    expect(html).toContain('<a href="https://example.com">')
  })

  describe('sanitization (the XSS gate)', () => {
    it('strips script tags from raw HTML', () => {
      const html = renderMarkdown('hello <script>alert(1)</script> world')
      expect(html).not.toContain('<script')
      expect(html).toContain('hello')
    })

    it('strips event handlers from elements', () => {
      const html = renderMarkdown('<img src=x onerror=alert(1)>')
      expect(html).not.toContain('onerror')
      expect(html).toContain('<img src="x">')
    })

    it('never emits javascript: hrefs (markdown-it refuses the link itself)', () => {
      const html = renderMarkdown('[click](javascript:alert(1))')
      expect(html).not.toContain('href="javascript:')
      expect(html).not.toContain('<a')
    })

    it('strips javascript: hrefs arriving as raw HTML', () => {
      const html = renderMarkdown('<a href="javascript:alert(1)">x</a>')
      expect(html).not.toContain('javascript:')
    })

    it('keeps harmless raw HTML', () => {
      const html = renderMarkdown('<em>fine</em>')
      expect(html).toContain('<em>fine</em>')
    })
  })

  describe('diagram placeholders', () => {
    it('turns mermaid fences into placeholders carrying the source', () => {
      const html = renderMarkdown('```mermaid\nflowchart LR\n  A --> B\n```')
      expect(html).toContain('diagram-placeholder-mermaid')
      expect(html).toContain(`data-diagram="${encodeURIComponent('flowchart LR\n  A --> B\n')}"`)
      expect(html).not.toContain('<code')
    })

    it('turns plantuml fences into placeholders', () => {
      const html = renderMarkdown('```plantuml\nA -> B\n```')
      expect(html).toContain('diagram-placeholder-plantuml')
    })

    it('treats fence info case-insensitively', () => {
      const html = renderMarkdown('```Mermaid\nflowchart LR\n```')
      expect(html).toContain('diagram-placeholder-mermaid')
    })

    it('leaves other fence languages as code blocks', () => {
      const html = renderMarkdown('```python\nprint(1)\n```')
      expect(html).toContain('<code')
      expect(html).not.toContain('diagram-placeholder')
    })
  })
})
