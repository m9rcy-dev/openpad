/**
 * URL-safe codec for share links, with gzip compression on top of the
 * original UTF-8 → base64 → URL-safe substitution scheme (the same
 * algorithm as `shareable-notepad`'s `Codec` module
 * (`/Users/m9rcy/dev/ai/shareable-notepad/app.js`): `+`/`/`/`=` swapped
 * for `-`/`_`/nothing, so the result is safe to drop straight into a URL
 * hash with no further escaping).
 *
 * Encoded output carries a one-character marker + `.` prefix so decode
 * can tell compressed, plain, and legacy payloads apart:
 * - `z.<base64url of gzip bytes>` — compressed (the common case)
 * - `u.<base64url of raw bytes>` — uncompressed (chosen when compression
 *   doesn't help, e.g. gzip's ~18-20 byte fixed overhead on tiny input,
 *   or when `CompressionStream` isn't available)
 * - no marker at all — the original pre-compression format. `.` never
 *   appears in that format's alphabet (`[A-Za-z0-9\-_]`), so an absent
 *   marker unambiguously means "legacy": links shared before compression
 *   was added keep decoding correctly forever.
 */

const CHUNK_SIZE = 0x8000
const COMPRESSED_MARKER = 'z.'
const PLAIN_MARKER = 'u.'

function bytesToBinaryString(bytes: Uint8Array): string {
  let result = ''
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    result += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE))
  }
  return result
}

function toBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(bytesToBinaryString(bytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64Url(encoded: string): Uint8Array {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padding = 4 - (base64.length % 4)
  if (padding !== 4) {
    base64 += '='.repeat(padding)
  }
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

function toStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}

// `CompressionStream`/`DecompressionStream`'s `.writable` is typed as
// `WritableStream<BufferSource>` in lib.dom.d.ts, which TS won't line up
// structurally with `ReadableStream<Uint8Array>.pipeThrough`'s expected
// `ReadableWritablePair<Uint8Array, Uint8Array>` — a known lib.dom.d.ts
// gap for this API, not a real type mismatch (Uint8Array is BufferSource).
type BytesTransform = ReadableWritablePair<Uint8Array, Uint8Array>

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = toStream(bytes).pipeThrough(
    new CompressionStream('gzip') as unknown as BytesTransform,
  )
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = toStream(bytes).pipeThrough(
    new DecompressionStream('gzip') as unknown as BytesTransform,
  )
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/**
 * Encodes text into a URL-safe string, compressed when that produces a
 * shorter result. Never throws — falls back to `''` on failure.
 *
 * @example
 * await encodeShareContent('hello') // 'u.aGVsbG8'
 */
export async function encodeShareContent(text: string): Promise<string> {
  if (text === '') {
    return ''
  }
  try {
    const bytes = new TextEncoder().encode(text)
    if (typeof CompressionStream === 'undefined') {
      return toBase64Url(bytes)
    }
    const compressed = await gzip(bytes)
    return compressed.length < bytes.length
      ? COMPRESSED_MARKER + toBase64Url(compressed)
      : PLAIN_MARKER + toBase64Url(bytes)
  } catch {
    return ''
  }
}

/**
 * Decodes a string produced by {@link encodeShareContent} — or by the
 * pre-compression version of this codec — back to text. Never throws —
 * malformed/corrupted/unsupported input decodes to `''` instead.
 *
 * @example
 * await decodeShareContent('u.aGVsbG8') // 'hello'
 */
export async function decodeShareContent(encoded: string): Promise<string> {
  if (encoded === '') {
    return ''
  }
  try {
    if (encoded.startsWith(COMPRESSED_MARKER)) {
      const compressed = fromBase64Url(encoded.slice(COMPRESSED_MARKER.length))
      const bytes = await gunzip(compressed)
      return new TextDecoder().decode(bytes)
    }
    if (encoded.startsWith(PLAIN_MARKER)) {
      return new TextDecoder().decode(fromBase64Url(encoded.slice(PLAIN_MARKER.length)))
    }
    return new TextDecoder().decode(fromBase64Url(encoded))
  } catch {
    return ''
  }
}
