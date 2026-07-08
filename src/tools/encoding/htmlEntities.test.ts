import { describe, expect, it } from 'vitest'
import { escapeHtml, unescapeHtml } from './htmlEntities'

describe('escapeHtml', () => {
  it('escapes the five HTML-special characters', () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toEqual({
      ok: true,
      output: '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
    })
  })

  it('leaves other text untouched', () => {
    expect(escapeHtml('plain text 123 ü')).toEqual({ ok: true, output: 'plain text 123 ü' })
  })
})

describe('unescapeHtml', () => {
  it('decodes named entities', () => {
    expect(unescapeHtml('&lt;b&gt; &amp; &quot;x&quot; &copy;')).toEqual({
      ok: true,
      output: '<b> & "x" ©',
    })
  })

  it('decodes decimal and hex numeric references', () => {
    expect(unescapeHtml('&#65;&#x42;&#x1F600;')).toEqual({ ok: true, output: 'AB😀' })
  })

  it('decodes uppercase-X hex references too', () => {
    expect(unescapeHtml('&#X1F600;')).toEqual({ ok: true, output: '😀' })
  })

  it('leaves malformed numeric references untouched (not matched at all)', () => {
    // 'a1' isn't a valid decimal number and has no x/X marker for hex,
    // so the regex simply doesn't recognize it as an entity.
    expect(unescapeHtml('&#a1;')).toEqual({ ok: true, output: '&#a1;' })
  })

  it('leaves unknown named entities untouched (loss-free)', () => {
    expect(unescapeHtml('&unknown; &fake;')).toEqual({ ok: true, output: '&unknown; &fake;' })
  })

  it('leaves out-of-range numeric references untouched', () => {
    expect(unescapeHtml('&#x110000;')).toEqual({ ok: true, output: '&#x110000;' })
  })

  it('round-trips through escapeHtml', () => {
    const text = `<script>alert("x & y")</script>`
    const escaped = escapeHtml(text)
    if (!escaped.ok) throw new Error('expected success')
    expect(unescapeHtml(escaped.output)).toEqual({ ok: true, output: text })
  })
})
