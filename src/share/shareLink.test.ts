import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildShareUrl, isOverShareLimit, MAX_SHARE_CHARS } from './shareLink'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('isOverShareLimit', () => {
  it('is false under the limit', () => {
    expect(isOverShareLimit('a'.repeat(MAX_SHARE_CHARS - 1))).toBe(false)
  })

  it('is false exactly at the limit', () => {
    expect(isOverShareLimit('a'.repeat(MAX_SHARE_CHARS))).toBe(false)
  })

  it('is true one character over the limit', () => {
    expect(isOverShareLimit('a'.repeat(MAX_SHARE_CHARS + 1))).toBe(true)
  })
})

describe('buildShareUrl', () => {
  it('builds a URL from the current origin and pathname with the content in the hash', async () => {
    const url = await buildShareUrl('hello')
    const parsed = new URL(url)
    expect(parsed.origin).toBe(window.location.origin)
    expect(parsed.pathname).toBe(window.location.pathname)
    // 'hello' is short enough that gzip overhead makes it larger, so
    // encodeShareContent picks the uncompressed 'u.' marker.
    expect(parsed.hash).toBe('#u.aGVsbG8')
  })

  it('produces an empty hash for empty content', async () => {
    const url = await buildShareUrl('')
    expect(new URL(url).hash).toBe('')
  })
})
