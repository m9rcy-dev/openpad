/**
 * JSON tools: format (pretty-print), minify, and validate.
 *
 * All three share one parse step. Parse errors are reported with a
 * 1-based line/column computed from the character offset V8 includes in
 * its error messages, so the UI can point at the offending spot.
 */
import { toolError, toolOk, type TextPosition, type ToolResult } from '../../types/tools'

/** Indent used by {@link formatJson}; two spaces, matching the editor. */
const INDENT = 2

type ParseOutcome =
  { ok: true; value: unknown } | { ok: false; error: string; position?: TextPosition }

/** Extracts "… at position N …" from a JSON.parse error, if present. */
function errorPosition(message: string, input: string): TextPosition | undefined {
  const match = /at position (\d+)/.exec(message)
  if (match?.[1] === undefined) {
    return undefined
  }
  return offsetToPosition(input, Number.parseInt(match[1], 10))
}

/** Converts a 0-based character offset to a 1-based line/column. */
export function offsetToPosition(text: string, offset: number): TextPosition {
  const clamped = Math.min(Math.max(offset, 0), text.length)
  let line = 1
  let lineStart = 0
  for (let i = 0; i < clamped; i += 1) {
    if (text[i] === '\n') {
      line += 1
      lineStart = i + 1
    }
  }
  return { line, column: clamped - lineStart + 1 }
}

function parse(input: string): ParseOutcome {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty — nothing to parse.' }
  }
  try {
    return { ok: true, value: JSON.parse(input) }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught)
    return { ok: false, error: `Invalid JSON: ${message}`, position: errorPosition(message, input) }
  }
}

/**
 * Pretty-prints JSON with 2-space indentation.
 *
 * @example
 * formatJson('{"a":1}') // { ok: true, output: '{\n  "a": 1\n}' }
 */
export function formatJson(input: string): ToolResult {
  const outcome = parse(input)
  if (!outcome.ok) {
    return toolError(outcome.error, outcome.position)
  }
  return toolOk(JSON.stringify(outcome.value, null, INDENT))
}

/**
 * Minifies JSON to a single line with no insignificant whitespace.
 *
 * @example
 * minifyJson('{\n  "a": 1\n}') // { ok: true, output: '{"a":1}' }
 */
export function minifyJson(input: string): ToolResult {
  const outcome = parse(input)
  if (!outcome.ok) {
    return toolError(outcome.error, outcome.position)
  }
  return toolOk(JSON.stringify(outcome.value))
}

/**
 * Validates JSON without changing the document: the output is the input.
 * Success carries a status-bar message; failure reports line/column.
 *
 * @example
 * validateJson('{"a":1}')  // { ok: true, output: '{"a":1}', message: 'Valid JSON' }
 * validateJson('{"a":}')   // { ok: false, error: 'Invalid JSON: …', position: {…} }
 */
export function validateJson(input: string): ToolResult {
  const outcome = parse(input)
  if (!outcome.ok) {
    return toolError(outcome.error, outcome.position)
  }
  return toolOk(input, 'Valid JSON')
}
