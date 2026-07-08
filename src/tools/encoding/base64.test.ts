import { describe, expect, it } from 'vitest'
import { decodeBase64, encodeBase64 } from './base64'

describe('encodeBase64', () => {
  it('encodes ASCII text', () => {
    expect(encodeBase64('hello')).toEqual({ ok: true, output: 'aGVsbG8=' })
  })

  it('encodes the empty string to the empty string', () => {
    expect(encodeBase64('')).toEqual({ ok: true, output: '' })
  })

  it('handles large inputs (chunked conversion)', () => {
    const large = 'x'.repeat(200_000)
    const encoded = encodeBase64(large)
    if (!encoded.ok) throw new Error('expected success')
    expect(decodeBase64(encoded.output)).toEqual({ ok: true, output: large })
  })
})

describe('decodeBase64', () => {
  it('decodes ASCII text', () => {
    expect(decodeBase64('aGVsbG8=')).toEqual({ ok: true, output: 'hello' })
  })

  it('tolerates whitespace and line wraps', () => {
    expect(decodeBase64('aGVs\nbG8=\n')).toEqual({ ok: true, output: 'hello' })
  })

  it('rejects non-Base64 input', () => {
    const result = decodeBase64('not base64!!!')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/not valid Base64/)
  })

  it('rejects Base64 that is not UTF-8 text', () => {
    // 0xFF 0xFE is not a valid UTF-8 sequence.
    const result = decodeBase64('//4=')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/not valid UTF-8/)
  })
})

describe('round-trips', () => {
  it.each(['héllo wörld', '日本語テキスト', '👋🏽 emoji – dashes … ellipsis', 'line1\nline2\ttab'])(
    'round-trips %s',
    (text) => {
      const encoded = encodeBase64(text)
      if (!encoded.ok) throw new Error('expected success')
      expect(decodeBase64(encoded.output)).toEqual({ ok: true, output: text })
    },
  )
})
