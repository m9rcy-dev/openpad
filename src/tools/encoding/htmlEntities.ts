/**
 * HTML entity escape/unescape.
 *
 * Escaping covers the five characters with special meaning in HTML.
 * Unescaping handles numeric references (`&#65;`, `&#x1F600;`) plus the
 * common named entities below; unknown names are left untouched rather
 * than guessed at, so the operation is always loss-free.
 */
import { toolOk, type ToolResult } from '../../types/tools'

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Named entities recognized by {@link unescapeHtml}. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
}

/**
 * Escapes HTML-special characters.
 *
 * @example
 * escapeHtml('<a href="x">&</a>')
 * // { ok: true, output: '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;' }
 */
export function escapeHtml(input: string): ToolResult {
  return toolOk(input.replace(/[&<>"']/g, (char) => ESCAPES[char]))
}

/**
 * Reverses {@link escapeHtml} and resolves numeric character references.
 * The regex only ever matches digits valid for the base it captured (hex
 * after `#x`/`#X`, decimal after a bare `#`), so `parseInt` here can
 * never produce `NaN` — only out-of-range code points, which
 * {@link safeFromCodePoint} already guards against.
 *
 * @example
 * unescapeHtml('&lt;b&gt;&#65;&#x42;&lt;/b&gt;') // { ok: true, output: '<b>AB</b>' }
 */
export function unescapeHtml(input: string): ToolResult {
  const output = input.replace(
    /&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g,
    (whole: string, body: string): string => {
      if (body[1] === 'x' || body[1] === 'X') {
        return safeFromCodePoint(Number.parseInt(body.slice(2), 16), whole)
      }
      if (body[0] === '#') {
        return safeFromCodePoint(Number.parseInt(body.slice(1), 10), whole)
      }
      return NAMED_ENTITIES[body] ?? whole
    },
  )
  return toolOk(output)
}

/** Guards String.fromCodePoint against out-of-range references. */
function safeFromCodePoint(code: number, fallback: string): string {
  return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : fallback
}
