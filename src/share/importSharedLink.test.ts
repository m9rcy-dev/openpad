import { afterEach, describe, expect, it } from 'vitest'
import { encodeShareContent } from './codec'
import { consumeSharedLink } from './importSharedLink'
import { MAX_SHARE_CHARS } from './shareLink'

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('consumeSharedLink', () => {
  it('returns null when there is no hash', () => {
    expect(consumeSharedLink()).toBeNull()
  })

  it('returns the decoded content for a valid link and clears the hash', () => {
    window.location.hash = encodeShareContent('hello shared world')
    const result = consumeSharedLink()
    expect(result).toEqual({ content: 'hello shared world', truncated: false })
    expect(window.location.hash).toBe('')
  })

  it('round-trips Unicode content', () => {
    window.location.hash = encodeShareContent('你好 🎉')
    expect(consumeSharedLink()).toEqual({ content: '你好 🎉', truncated: false })
  })

  it('returns null for a hash that fails to decode, but still clears it', () => {
    window.location.hash = 'not-valid-base64!!!'
    expect(consumeSharedLink()).toBeNull()
    expect(window.location.hash).toBe('')
  })

  it('truncates content longer than MAX_SHARE_CHARS and reports it', () => {
    const oversized = 'x'.repeat(MAX_SHARE_CHARS + 500)
    window.location.hash = encodeShareContent(oversized)
    const result = consumeSharedLink()
    expect(result?.truncated).toBe(true)
    expect(result?.content.length).toBe(MAX_SHARE_CHARS)
    expect(result?.content).toBe(oversized.slice(0, MAX_SHARE_CHARS))
  })

  it('preserves the pathname and query string when clearing the hash', () => {
    window.history.replaceState(null, '', '/openpad/?foo=bar#will-be-overwritten')
    window.location.hash = encodeShareContent('content')
    consumeSharedLink()
    expect(window.location.pathname).toBe('/openpad/')
    expect(window.location.search).toBe('?foo=bar')
    expect(window.location.hash).toBe('')
  })
})
