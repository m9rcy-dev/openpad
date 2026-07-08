/**
 * Markdown → sanitized HTML pipeline.
 *
 * Rendering: markdown-it with GitHub-style extras (linkify, task lists
 * come from the fence/list syntax markdown-it already supports).
 * Fenced code blocks tagged `mermaid` or `plantuml` are NOT rendered as
 * code — they become placeholder <div>s carrying their source in a
 * `data-diagram` attribute, which PreviewPane later turns into real
 * diagrams.
 *
 * SECURITY RULE (do not weaken): every byte of HTML this module returns
 * has passed through DOMPurify. Raw HTML in the markdown is allowed in,
 * precisely because DOMPurify strips anything executable (scripts, event
 * handlers, javascript: URLs) on the way out.
 */
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

/** Diagram fence languages that get placeholder treatment. */
export type DiagramKind = 'mermaid' | 'plantuml'

/** CSS class carried by diagram placeholders, per kind. */
export const DIAGRAM_CLASS: Record<DiagramKind, string> = {
  mermaid: 'diagram-placeholder-mermaid',
  plantuml: 'diagram-placeholder-plantuml',
}

const md = new MarkdownIt({
  html: true, // raw HTML allowed in — DOMPurify guards the way out
  linkify: true,
})

// Replace the default fence renderer so diagram fences become
// placeholders; all other fences render as ordinary code blocks.
const defaultFence =
  md.renderer.rules.fence ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const info = token?.info.trim().toLowerCase()
  if (token !== undefined && (info === 'mermaid' || info === 'plantuml')) {
    const source = encodeURIComponent(token.content)
    return `<div class="${DIAGRAM_CLASS[info]}" data-diagram="${source}"></div>`
  }
  return defaultFence(tokens, idx, options, env, self)
}

/**
 * Renders markdown to sanitized HTML.
 *
 * @example
 * renderMarkdown('# Hi **there**')
 * // '<h1>Hi <strong>there</strong></h1>\n'
 * renderMarkdown('<img src=x onerror=alert(1)>')
 * // '<img src="x">' — the handler is stripped
 */
export function renderMarkdown(source: string): string {
  const rendered = md.render(source)
  return DOMPurify.sanitize(rendered, {
    // Keep the diagram payload attribute; DOMPurify would drop it as
    // unknown otherwise. The value is URI-encoded text, never HTML.
    ADD_ATTR: ['data-diagram'],
  })
}
