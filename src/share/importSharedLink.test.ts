import { afterEach, describe, expect, it } from 'vitest'
import { encodeShareContent } from './codec'
import { consumeSharedLink } from './importSharedLink'
import { MAX_SHARE_CHARS } from './shareLink'

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('consumeSharedLink', () => {
  it('returns null when there is no hash', async () => {
    expect(await consumeSharedLink()).toBeNull()
  })

  it('returns the decoded content for a valid link and clears the hash', async () => {
    window.location.hash = await encodeShareContent('hello shared world')
    const result = await consumeSharedLink()
    expect(result).toEqual({ content: 'hello shared world', truncated: false })
    expect(window.location.hash).toBe('')
  })

  it('round-trips Unicode content', async () => {
    window.location.hash = await encodeShareContent('你好 🎉')
    expect(await consumeSharedLink()).toEqual({ content: '你好 🎉', truncated: false })
  })

  it('round-trips content compressed with the z. marker', async () => {
    const content = 'repeat me '.repeat(1000)
    const encoded = await encodeShareContent(content)
    expect(encoded.startsWith('z.')).toBe(true)
    window.location.hash = encoded
    expect(await consumeSharedLink()).toEqual({ content, truncated: false })
  })

  it('decodes a legacy pre-compression link (no marker prefix)', async () => {
    window.location.hash = 'aGVsbG8'
    expect(await consumeSharedLink()).toEqual({ content: 'hello', truncated: false })
  })

  it('returns null for a hash that fails to decode, but still clears it', async () => {
    window.location.hash = 'not-valid-base64!!!'
    expect(await consumeSharedLink()).toBeNull()
    expect(window.location.hash).toBe('')
  })

  it('truncates content longer than MAX_SHARE_CHARS and reports it', async () => {
    const oversized = 'x'.repeat(MAX_SHARE_CHARS + 500)
    window.location.hash = await encodeShareContent(oversized)
    const result = await consumeSharedLink()
    expect(result?.truncated).toBe(true)
    expect(result?.content.length).toBe(MAX_SHARE_CHARS)
    expect(result?.content).toBe(oversized.slice(0, MAX_SHARE_CHARS))
  })

  it('preserves the pathname and query string when clearing the hash', async () => {
    window.history.replaceState(null, '', '/openpad/?foo=bar#will-be-overwritten')
    window.location.hash = await encodeShareContent('content')
    await consumeSharedLink()
    expect(window.location.pathname).toBe('/openpad/')
    expect(window.location.search).toBe('?foo=bar')
    expect(window.location.hash).toBe('')
  })
})
