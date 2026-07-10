import { describe, expect, it } from 'vitest'
import { decodeShareContent, encodeShareContent } from './codec'

/** Round-trips through encode then decode. */
function roundTrip(text: string): string {
  return decodeShareContent(encodeShareContent(text))
}

describe('encodeShareContent / decodeShareContent', () => {
  it('round-trips ASCII text', () => {
    expect(roundTrip('Hello World!')).toBe('Hello World!')
  })

  it('round-trips an empty string', () => {
    expect(encodeShareContent('')).toBe('')
    expect(decodeShareContent('')).toBe('')
  })

  it('round-trips Unicode (Chinese)', () => {
    expect(roundTrip('你好世界！')).toBe('你好世界！')
  })

  it('round-trips emoji', () => {
    expect(roundTrip('🎉📝✨🚀💻')).toBe('🎉📝✨🚀💻')
  })

  it('round-trips mixed content', () => {
    expect(roundTrip('Hello 你好 🎉 123 € ∑')).toBe('Hello 你好 🎉 123 € ∑')
  })

  it('round-trips newlines and tabs', () => {
    expect(roundTrip('Line 1\nLine 2\tTabbed')).toBe('Line 1\nLine 2\tTabbed')
  })

  it('round-trips Arabic (RTL)', () => {
    expect(roundTrip('مرحبا بالعالم!')).toBe('مرحبا بالعالم!')
  })

  it('round-trips long text (10k chars) without a call-stack overflow', () => {
    const original = 'A'.repeat(10_000)
    expect(roundTrip(original)).toBe(original)
  })

  it('round-trips text past the browser spread-argument risk zone (100k chars)', () => {
    const original = '🎉'.repeat(100_000)
    expect(roundTrip(original)).toBe(original)
  })

  it('produces a URL-safe alphabet with no +, /, or = characters', () => {
    const encoded = encodeShareContent('any text at all, really ??//++==')
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]*$/)
  })

  it('decodes malformed/corrupted input to an empty string instead of throwing', () => {
    expect(decodeShareContent('not-valid-base64!!!')).toBe('')
    expect(() => decodeShareContent('%%%')).not.toThrow()
  })
})
