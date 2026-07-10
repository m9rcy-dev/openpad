/**
 * Builds the shareable URL for a document and gates whether one can be
 * built at all — see docs/openpad-feature-02-plan.md Part B, Design
 * decision 1: length is the only real constraint (every character
 * becomes part of a base64url alphabet before it touches the URL, so
 * there's no "invalid character" case), and the gate applies to the
 * source text, not the (longer) encoded output.
 */
import { encodeShareContent } from './codec'

/**
 * Same ceiling `shareable-notepad` already validates in production —
 * see `CONFIG.MAX_CHARS` in that app's `app.js`.
 */
export const MAX_SHARE_CHARS = 20_000

/** True when `content` is too long to generate a share link for. */
export function isOverShareLimit(content: string): boolean {
  return content.length > MAX_SHARE_CHARS
}

/**
 * Builds a link back to wherever OpenPad is currently being served from
 * (works unmodified in local dev and on the deployed GitHub Pages
 * `base` path — no hardcoded domain), with `content` encoded into the
 * hash fragment.
 *
 * @example
 * buildShareUrl('hello') // 'http://localhost:5173/#aGVsbG8'
 */
export function buildShareUrl(content: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#${encodeShareContent(content)}`
}
