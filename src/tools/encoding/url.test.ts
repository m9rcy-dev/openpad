import { describe, expect, it } from 'vitest'
import { decodeUrl, encodeUrl } from './url'

describe('encodeUrl', () => {
  it('percent-encodes reserved characters', () => {
    expect(encodeUrl('a b&c=d?e')).toEqual({ ok: true, output: 'a%20b%26c%3Dd%3Fe' })
  })

  it('passes through unreserved characters', () => {
    expect(encodeUrl('abc-_.~123')).toEqual({ ok: true, output: 'abc-_.~123' })
  })

  it('encodes unicode as UTF-8 sequences', () => {
    expect(encodeUrl('ü')).toEqual({ ok: true, output: '%C3%BC' })
  })

  it('reports lone surrogates as errors instead of throwing', () => {
    const result = encodeUrl('\uD800')
    expect(result.ok).toBe(false)
  })
})

describe('decodeUrl', () => {
  it('decodes percent sequences', () => {
    expect(decodeUrl('a%20b%26c')).toEqual({ ok: true, output: 'a b&c' })
  })

  it('rejects malformed percent sequences', () => {
    const result = decodeUrl('%GG')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/not a valid URL-encoded/)
  })

  it('round-trips unicode', () => {
    const text = 'påth/tö?q=väl&x=1'
    const encoded = encodeUrl(text)
    if (!encoded.ok) throw new Error('expected success')
    expect(decodeUrl(encoded.output)).toEqual({ ok: true, output: text })
  })
})
