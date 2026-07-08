/**
 * Applies a tool to a CodeMirror editor.
 *
 * Semantics (Notepad++-style): when text is selected the tool transforms
 * just the selection; otherwise it transforms the whole document. On
 * success the result replaces that range in a single undoable change; on
 * failure the document is untouched and the error is returned for the
 * status bar.
 */
import type { EditorView } from '@codemirror/view'
import type { ToolDefinition, ToolResult } from '../types/tools'

/** What happened when a tool ran, enriched for status display. */
export interface ToolRunStatus {
  toolId: string
  /** e.g. "JSON · Format" — category-qualified label for messages. */
  toolName: string
  result: ToolResult
  /** True when the tool ran on a selection rather than the whole document. */
  appliedToSelection: boolean
}

export function applyToolToEditor(view: EditorView, tool: ToolDefinition): ToolRunStatus {
  const { from, to } = view.state.selection.main
  const appliedToSelection = from !== to
  const rangeFrom = appliedToSelection ? from : 0
  const rangeTo = appliedToSelection ? to : view.state.doc.length
  const input = view.state.sliceDoc(rangeFrom, rangeTo)

  const result = tool.run(input)
  if (result.ok && result.output !== input) {
    view.dispatch({
      changes: { from: rangeFrom, to: rangeTo, insert: result.output },
      // Keep the transformed range selected so chained tools compose.
      selection: appliedToSelection
        ? { anchor: rangeFrom, head: rangeFrom + result.output.length }
        : undefined,
    })
  }

  return {
    toolId: tool.id,
    toolName: `${tool.category} · ${tool.label}`,
    result,
    appliedToSelection,
  }
}
