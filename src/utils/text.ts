/**
 * Small text measurement helpers shared across the UI.
 */

/**
 * Counts non-empty whitespace-separated runs — the usual "word count".
 *
 * @example
 * countWords('one two  three\nfour') // 4
 * countWords('   ')                  // 0
 */
export function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length
}
