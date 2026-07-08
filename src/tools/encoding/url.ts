/**
 * URL percent-encoding tools, thin safety wrappers around
 * encodeURIComponent/decodeURIComponent.
 */
import { toolError, toolOk, type ToolResult } from '../../types/tools'

/**
 * Percent-encodes text for safe use in a URL component.
 *
 * @example
 * encodeUrl('a b&c') // { ok: true, output: 'a%20b%26c' }
 */
export function encodeUrl(input: string): ToolResult {
  try {
    return toolOk(encodeURIComponent(input))
  } catch {
    // Lone surrogates (malformed UTF-16) are the only failure mode.
    return toolError('Input contains characters that cannot be URL-encoded.')
  }
}

/**
 * Decodes percent-encoded text.
 *
 * @example
 * decodeUrl('a%20b%26c') // { ok: true, output: 'a b&c' }
 * decodeUrl('%GG')       // { ok: false, error: '…' }
 */
export function decodeUrl(input: string): ToolResult {
  try {
    return toolOk(decodeURIComponent(input))
  } catch {
    return toolError('Input is not a valid URL-encoded string.')
  }
}
