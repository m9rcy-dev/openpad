/**
 * Reads an inbound share link's payload out of `window.location.hash`
 * on boot. Not a `hashchange` listener like `shareable-notepad` uses —
 * OpenPad has no reason to react to the hash changing after boot,
 * since nothing else in the app ever sets it.
 */
import { decodeShareContent } from './codec'
import { MAX_SHARE_CHARS } from './shareLink'

export interface ConsumedShare {
  content: string
  /** True if the decoded content was longer than `MAX_SHARE_CHARS` and got cut down to it. */
  truncated: boolean
}

/**
 * Reads and clears `window.location.hash`, returning the decoded
 * content if there was a valid, non-empty payload. The hash is cleared
 * unconditionally once it's non-empty — even a malformed link doesn't
 * linger in the address bar — so a reload never re-imports the same
 * link into a second tab.
 *
 * `null` covers both "no link" (empty hash) and "not a real link"
 * (a hash that fails to decode, or decodes to nothing) — a normal
 * OpenPad-generated link never triggers the truncation path in
 * practice, since `Share…` is gated by the same `MAX_SHARE_CHARS`
 * ceiling before a link is ever generated; this exists for a
 * hand-edited or externally-produced hash.
 */
export function consumeSharedLink(): ConsumedShare | null {
  const hash = window.location.hash.slice(1)
  if (hash === '') {
    return null
  }

  window.history.replaceState(null, '', window.location.pathname + window.location.search)

  const decoded = decodeShareContent(hash)
  if (decoded === '') {
    return null
  }

  const truncated = decoded.length > MAX_SHARE_CHARS
  return { content: truncated ? decoded.slice(0, MAX_SHARE_CHARS) : decoded, truncated }
}
