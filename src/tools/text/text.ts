/**
 * Plain-text utilities: case conversion and line operations.
 * All operate on the whole input and preserve the trailing newline
 * behavior users expect (no silent newline added or removed).
 */
import { toolOk, type ToolResult } from '../../types/tools'

/**
 * Converts to UPPER CASE.
 * @example toUpperCase('abc') // { ok: true, output: 'ABC' }
 */
export function toUpperCase(input: string): ToolResult {
  return toolOk(input.toUpperCase())
}

/**
 * Converts to lower case.
 * @example toLowerCase('ABC') // { ok: true, output: 'abc' }
 */
export function toLowerCase(input: string): ToolResult {
  return toolOk(input.toLowerCase())
}

/**
 * Converts To Title Case: the first letter of every word is capitalized,
 * the rest lowered. Words are Unicode letter/number runs.
 *
 * @example
 * toTitleCase('hello WORLD') // { ok: true, output: 'Hello World' }
 */
export function toTitleCase(input: string): ToolResult {
  return toolOk(
    // The regex always matches at least one character, so `word` is
    // never empty here.
    input.replace(
      /[\p{L}\p{N}][\p{L}\p{N}'’]*/gu,
      (word) => word[0].toUpperCase() + word.slice(1).toLowerCase(),
    ),
  )
}

/** Splits into lines, remembering whether the input ended with a newline. */
function splitLines(input: string): { lines: string[]; trailingNewline: boolean } {
  const trailingNewline = input.endsWith('\n')
  const body = trailingNewline ? input.slice(0, -1) : input
  return { lines: body.split('\n'), trailingNewline }
}

function joinLines(lines: string[], trailingNewline: boolean): string {
  return lines.join('\n') + (trailingNewline ? '\n' : '')
}

/**
 * Sorts lines ascending (locale-aware, case-insensitive first pass).
 * @example sortLinesAscending('b\na') // { ok: true, output: 'a\nb' }
 */
export function sortLinesAscending(input: string): ToolResult {
  const { lines, trailingNewline } = splitLines(input)
  return toolOk(joinLines([...lines].sort(compareLines), trailingNewline))
}

/**
 * Sorts lines descending.
 * @example sortLinesDescending('a\nb') // { ok: true, output: 'b\na' }
 */
export function sortLinesDescending(input: string): ToolResult {
  const { lines, trailingNewline } = splitLines(input)
  return toolOk(
    joinLines(
      [...lines].sort((a, b) => compareLines(b, a)),
      trailingNewline,
    ),
  )
}

/** Locale-aware comparison with a stable tiebreak for equal-ignoring-case lines. */
function compareLines(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'variant' })
}

/**
 * Removes duplicate lines, keeping each line's first occurrence in place.
 * @example removeDuplicateLines('a\nb\na') // { ok: true, output: 'a\nb' }
 */
export function removeDuplicateLines(input: string): ToolResult {
  const { lines, trailingNewline } = splitLines(input)
  const seen = new Set<string>()
  const unique = lines.filter((line) => {
    if (seen.has(line)) {
      return false
    }
    seen.add(line)
    return true
  })
  return toolOk(joinLines(unique, trailingNewline))
}

/**
 * Trims trailing spaces and tabs from every line.
 * @example trimTrailingWhitespace('a  \nb\t') // { ok: true, output: 'a\nb' }
 */
export function trimTrailingWhitespace(input: string): ToolResult {
  const { lines, trailingNewline } = splitLines(input)
  return toolOk(
    joinLines(
      lines.map((line) => line.replace(/[ \t]+$/, '')),
      trailingNewline,
    ),
  )
}

/**
 * Removes lines that are empty or whitespace-only.
 * @example removeEmptyLines('a\n\n \nb') // { ok: true, output: 'a\nb' }
 */
export function removeEmptyLines(input: string): ToolResult {
  const { lines, trailingNewline } = splitLines(input)
  return toolOk(
    joinLines(
      lines.filter((line) => line.trim() !== ''),
      trailingNewline,
    ),
  )
}
