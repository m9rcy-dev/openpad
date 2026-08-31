import { afterEach, describe, expect, it, vi } from 'vitest'
import { decodeShareContent, encodeShareContent } from './codec'

/** Round-trips through encode then decode. */
async function roundTrip(text: string): Promise<string> {
  return decodeShareContent(await encodeShareContent(text))
}

describe('encodeShareContent / decodeShareContent', () => {
  it('round-trips ASCII text', async () => {
    expect(await roundTrip('Hello World!')).toBe('Hello World!')
  })

  it('round-trips an empty string', async () => {
    expect(await encodeShareContent('')).toBe('')
    expect(await decodeShareContent('')).toBe('')
  })

  it('round-trips Unicode (Chinese)', async () => {
    expect(await roundTrip('你好世界！')).toBe('你好世界！')
  })

  it('round-trips emoji', async () => {
    expect(await roundTrip('🎉📝✨🚀💻')).toBe('🎉📝✨🚀💻')
  })

  it('round-trips mixed content', async () => {
    expect(await roundTrip('Hello 你好 🎉 123 € ∑')).toBe('Hello 你好 🎉 123 € ∑')
  })

  it('round-trips newlines and tabs', async () => {
    expect(await roundTrip('Line 1\nLine 2\tTabbed')).toBe('Line 1\nLine 2\tTabbed')
  })

  it('round-trips Arabic (RTL)', async () => {
    expect(await roundTrip('مرحبا بالعالم!')).toBe('مرحبا بالعالم!')
  })

  it('round-trips long text (10k chars) without a call-stack overflow', async () => {
    const original = 'A'.repeat(10_000)
    expect(await roundTrip(original)).toBe(original)
  })

  it('round-trips text past the browser spread-argument risk zone (100k chars)', async () => {
    const original = '🎉'.repeat(100_000)
    expect(await roundTrip(original)).toBe(original)
  })

  it('produces a URL-safe alphabet with no +, /, or = characters', async () => {
    const encoded = await encodeShareContent('any text at all, really ??//++==')
    expect(encoded.length).toBeGreaterThan(0)
    expect(encoded).toMatch(/^[A-Za-z0-9\-_.]*$/)
  })

  it('decodes malformed/corrupted input to an empty string instead of throwing', async () => {
    expect(await decodeShareContent('not-valid-base64!!!')).toBe('')
    await expect(decodeShareContent('%%%')).resolves.not.toThrow()
  })

  it('compresses large, repetitive text with the z. marker', async () => {
    const original = 'A'.repeat(5_000)
    const encoded = await encodeShareContent(original)
    expect(encoded.startsWith('z.')).toBe(true)
    expect(encoded.length).toBeLessThan(original.length)
    expect(await decodeShareContent(encoded)).toBe(original)
  })

  it('leaves tiny text uncompressed with the u. marker, since gzip overhead would grow it', async () => {
    const encoded = await encodeShareContent('hello')
    expect(encoded).toBe('u.aGVsbG8')
    expect(await decodeShareContent(encoded)).toBe('hello')
  })

  it('decodes a legacy pre-compression link (no marker prefix)', async () => {
    // 'hello' encoded by the original, pre-compression codec.
    expect(await decodeShareContent('aGVsbG8')).toBe('hello')
  })

  describe('without CompressionStream/DecompressionStream support', () => {
    const originalCompressionStream = globalThis.CompressionStream
    const originalDecompressionStream = globalThis.DecompressionStream

    afterEach(() => {
      globalThis.CompressionStream = originalCompressionStream
      globalThis.DecompressionStream = originalDecompressionStream
    })

    it('falls back to the legacy unmarked format when encoding', async () => {
      // @ts-expect-error -- simulating an older browser for this test
      delete globalThis.CompressionStream
      const encoded = await encodeShareContent('hello')
      expect(encoded).toBe('aGVsbG8')
      expect(await decodeShareContent(encoded)).toBe('hello')
    })

    it('fails closed to an empty string when decoding a compressed link', async () => {
      const encoded = await encodeShareContent('A'.repeat(5_000))
      expect(encoded.startsWith('z.')).toBe(true)
      // @ts-expect-error -- simulating an older browser for this test
      delete globalThis.DecompressionStream
      expect(await decodeShareContent(encoded)).toBe('')
    })
  })

  it('never throws even when CompressionStream construction fails', async () => {
    const spy = vi.spyOn(globalThis, 'CompressionStream').mockImplementation(() => {
      throw new Error('boom')
    })
    expect(await encodeShareContent('hello')).toBe('')
    spy.mockRestore()
  })
})
