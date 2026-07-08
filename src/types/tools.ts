/**
 * Types for the transform-tool system.
 *
 * Every tool is a pure function from input text to a {@link ToolResult}.
 * Tools never throw: malformed input (invalid JSON, bad Base64, …) is a
 * normal, expected outcome and comes back as `{ ok: false }` so the UI can
 * show it in the status bar. See docs/ARCHITECTURE.md and CLAUDE.md.
 */

/** 1-based location of an error inside the input text, when known. */
export interface TextPosition {
  line: number
  column: number
}

/** Outcome of running a tool. A discriminated union — check `ok` first. */
export type ToolResult =
  | {
      ok: true
      /** The transformed text that replaces the tool's input. */
      output: string
      /** Optional status-bar note, e.g. "Valid JSON". */
      message?: string
    }
  | {
      ok: false
      /** Human-readable description of what was wrong with the input. */
      error: string
      position?: TextPosition
    }

/** Menu groupings; also the section headers in the Tools menu. */
export type ToolCategory = 'Encoding' | 'JSON' | 'XML' | 'Text'

/** A registered tool: metadata plus its pure transform function. */
export interface ToolDefinition {
  /** Stable id, kebab-case, e.g. `json-format`. */
  id: string
  /** Menu label, e.g. "Format". */
  label: string
  category: ToolCategory
  /**
   * Keyboard shortcut in CodeMirror syntax (e.g. `Mod-Shift-f`), where
   * `Mod` is Cmd on macOS and Ctrl elsewhere. Optional.
   */
  shortcut?: string
  run: (input: string) => ToolResult
}

/** Convenience constructors keeping tool implementations terse. */
export const toolOk = (output: string, message?: string): ToolResult =>
  message === undefined ? { ok: true, output } : { ok: true, output, message }

export const toolError = (error: string, position?: TextPosition): ToolResult =>
  position === undefined ? { ok: false, error } : { ok: false, error, position }
