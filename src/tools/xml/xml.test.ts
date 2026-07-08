import { describe, expect, it } from 'vitest'
import { formatXml, minifyXml, validateXml } from './xml'

describe('formatXml', () => {
  it('pretty-prints nested elements', () => {
    expect(formatXml('<a><b>hi</b><c/></a>')).toEqual({
      ok: true,
      output: '<a>\n  <b>hi</b>\n  <c/>\n</a>',
    })
  })

  it('keeps text-only elements on one line and preserves attributes', () => {
    const result = formatXml('<root><item id="1" name="A &amp; B">x</item></root>')
    expect(result).toEqual({
      ok: true,
      output: '<root>\n  <item id="1" name="A &amp; B">x</item>\n</root>',
    })
  })

  it('preserves the XML declaration', () => {
    const result = formatXml('<?xml version="1.0" encoding="UTF-8"?><a><b/></a>')
    if (!result.ok) throw new Error('expected success')
    expect(result.output.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true)
  })

  it('preserves comments and CDATA', () => {
    const result = formatXml('<a><!-- note --><![CDATA[raw <stuff>]]></a>')
    if (!result.ok) throw new Error('expected success')
    expect(result.output).toContain('<!-- note -->')
    expect(result.output).toContain('<![CDATA[raw <stuff>]]>')
  })

  it('rejects malformed XML', () => {
    const result = formatXml('<a><b></a>')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/Invalid XML/)
  })

  it('rejects empty input', () => {
    const result = formatXml('')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/empty/)
  })

  it('serializes a text node that sits alongside element siblings', () => {
    // Mixed content (text + element children) skips the text-only
    // single-line path and serializes the text node individually.
    const result = formatXml('<a>hello<b/></a>')
    expect(result).toEqual({ ok: true, output: '<a>\n  hello\n  <b/>\n</a>' })
  })

  it('preserves a processing instruction inside the document', () => {
    const result = formatXml('<a><?pi target data?></a>')
    if (!result.ok) throw new Error('expected success')
    expect(result.output).toContain('<?pi target data?>')
  })

  it('drops a root-level DOCTYPE rather than erroring on it', () => {
    // A DOCUMENT_TYPE_NODE isn't text/CDATA/comment/PI/element; it's
    // silently skipped rather than serialized.
    const result = formatXml('<!DOCTYPE root><root/>')
    expect(result).toEqual({ ok: true, output: '<root/>' })
  })

  it('keeps a CDATA-only element on one line via the text-only fast path', () => {
    const result = formatXml('<a><![CDATA[raw <stuff>]]></a>')
    expect(result).toEqual({ ok: true, output: '<a><![CDATA[raw <stuff>]]></a>' })
  })
})

describe('minifyXml', () => {
  it('drops inter-element whitespace', () => {
    expect(minifyXml('<a>\n  <b>hi</b>\n  <c/>\n</a>')).toEqual({
      ok: true,
      output: '<a><b>hi</b><c/></a>',
    })
  })

  it('round-trips with formatXml', () => {
    const source = '<r a="1"><x>t</x><y><z/></y></r>'
    const formatted = formatXml(source)
    if (!formatted.ok) throw new Error('expected success')
    expect(minifyXml(formatted.output)).toEqual({ ok: true, output: source })
  })

  it('preserves the XML declaration', () => {
    const result = minifyXml('<?xml version="1.0"?>\n<a>\n  <b/>\n</a>')
    expect(result).toEqual({ ok: true, output: '<?xml version="1.0"?><a><b/></a>' })
  })

  it('keeps mixed-content text untrimmed (no pretty-printing to undo)', () => {
    const result = minifyXml('<a>hello <b/></a>')
    expect(result).toEqual({ ok: true, output: '<a>hello <b/></a>' })
  })
})

describe('validateXml', () => {
  it('returns the input unchanged with a success message', () => {
    const input = '<a>\n  <b/>\n</a>'
    expect(validateXml(input)).toEqual({ ok: true, output: input, message: 'Valid XML' })
  })

  it('reports parse errors', () => {
    const result = validateXml('<a foo=bar></a>')
    expect(result.ok).toBe(false)
  })
})
