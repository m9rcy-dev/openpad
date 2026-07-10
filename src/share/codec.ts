/**
 * UTF-8-safe base64url codec for share links — the same algorithm as
 * `shareable-notepad`'s `Codec` module
 * (`/Users/m9rcy/dev/ai/shareable-notepad/app.js`): UTF-8 bytes → base64
 * → `+`/`/`/`=` swapped for `-`/`_`/nothing, so the result is safe to
 * drop straight into a URL hash with no further escaping.
 *
 * One deliberate improvement over the reference: converting bytes to a
 * binary string in chunks instead of `String.fromCharCode(...bytes)` in
 * one call, which can throw `RangeError: Maximum call stack size
 * exceeded` on a large `Uint8Array` (each byte becomes a spread
 * argument). Same output, just safe at any input size.
 */

const CHUNK_SIZE = 0x8000

function bytesToBinaryString(bytes: Uint8Array): string {
  let result = ''
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    result += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE))
  }
  return result
}

/**
 * Encodes text into a URL-safe string. Never throws — malformed input
 * (there isn't really any, since any JS string is valid UTF-16) falls
 * back to `''`.
 *
 * @example
 * encodeShareContent('hello') // 'aGVsbG8'
 */
export function encodeShareContent(text: string): string {
  if (text === '') {
    return ''
  }
  try {
    const bytes = new TextEncoder().encode(text)
    const base64 = btoa(bytesToBinaryString(bytes))
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  } catch {
    return ''
  }
}

/**
 * Decodes a URL-safe string produced by {@link encodeShareContent} back
 * to text. Never throws — malformed/corrupted input decodes to `''`
 * instead.
 *
 * @example
 * decodeShareContent('aGVsbG8') // 'hello'
 */
export function decodeShareContent(encoded: string): string {
  if (encoded === '') {
    return ''
  }
  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padding = 4 - (base64.length % 4)
    if (padding !== 4) {
      base64 += '='.repeat(padding)
    }
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return ''
  }
}
