/**
 * Base64 encode/decode with full Unicode support.
 *
 * `btoa`/`atob` only handle Latin-1, so text is routed through
 * TextEncoder/TextDecoder: string → UTF-8 bytes → Base64 and back.
 * Decoding treats non-Base64 input and non-UTF-8 payloads as ordinary
 * user errors, not exceptions.
 */
import { toolError, toolOk, type ToolResult } from '../../types/tools'

/**
 * Encodes text as Base64 (UTF-8).
 *
 * @example
 * encodeBase64('hello')  // { ok: true, output: 'aGVsbG8=' }
 * encodeBase64('héllo…') // round-trips through decodeBase64
 */
export function encodeBase64(input: string): ToolResult {
  const bytes = new TextEncoder().encode(input)
  // Convert in chunks: String.fromCharCode(...allBytes) overflows the
  // argument limit on large documents.
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return toolOk(btoa(binary))
}

/**
 * Decodes Base64 into text, expecting a UTF-8 payload.
 *
 * @example
 * decodeBase64('aGVsbG8=') // { ok: true, output: 'hello' }
 * decodeBase64('not base64!') // { ok: false, error: '…' }
 */
export function decodeBase64(input: string): ToolResult {
  let binary: string
  try {
    // Whitespace (line-wrapped Base64, trailing newline) is legal padding
    // in practice; strip it before decoding.
    binary = atob(input.replace(/\s+/g, ''))
  } catch {
    return toolError('Input is not valid Base64.')
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  try {
    return toolOk(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    return toolError('Base64 decoded, but the result is not valid UTF-8 text.')
  }
}
