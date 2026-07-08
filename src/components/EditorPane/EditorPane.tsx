/**
 * The text editing surface: a CodeMirror 6 instance filling its container.
 *
 * Besides plain editing, the pane is where transform tools meet the
 * editor: the parent triggers tools through the imperative
 * {@link EditorPaneHandle} (menu clicks), and registry shortcuts are
 * bound directly into the editor keymap. Both paths run
 * `applyToolToEditor` and report through `onToolStatus`.
 */
import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react'
import { keymap, type EditorView } from '@codemirror/view'
import type { CursorInfo, DocumentLanguage } from '../../types/document'
import type { ToolDefinition } from '../../types/tools'
import { applyToolToEditor, type ToolRunStatus } from '../../tools/apply'
import { TOOLS } from '../../tools/registry'
import { useCodeMirror } from '../../editor/useCodeMirror'
import './EditorPane.css'

/** Imperative surface exposed to the parent via the `ref` prop. */
export interface EditorPaneHandle {
  /** Runs a tool on the selection (or whole document) and reports it. */
  runTool: (tool: ToolDefinition) => void
  /** Moves focus into the editor. */
  focus: () => void
}

export interface EditorPaneProps {
  value: string
  language: DocumentLanguage
  onChange: (text: string) => void
  onCursorChange?: (cursor: CursorInfo) => void
  /** Receives the outcome every time a tool runs (menu or shortcut). */
  onToolStatus?: (status: ToolRunStatus) => void
  /** Reports vertical scrolling as a 0..1 ratio (preview scroll sync). */
  onScrollRatio?: (ratio: number) => void
  ref?: Ref<EditorPaneHandle>
}

export function EditorPane({
  value,
  language,
  onChange,
  onCursorChange,
  onToolStatus,
  onScrollRatio,
  ref,
}: EditorPaneProps) {
  const onToolStatusRef = useRef(onToolStatus)
  useEffect(() => {
    onToolStatusRef.current = onToolStatus
  }, [onToolStatus])

  // Bind every registry shortcut into the editor. Created once per mount;
  // reads the status callback through a ref so it never goes stale.
  const shortcutKeymap = useMemo(
    () =>
      keymap.of(
        TOOLS.flatMap((tool) =>
          tool.shortcut === undefined
            ? []
            : [
                {
                  key: tool.shortcut,
                  preventDefault: true,
                  run: (view: EditorView) => {
                    onToolStatusRef.current?.(applyToolToEditor(view, tool))
                    return true
                  },
                },
              ],
        ),
      ),
    [],
  )

  const { containerRef, viewRef } = useCodeMirror({
    value,
    language,
    onChange,
    onCursorChange,
    extraExtensions: shortcutKeymap,
  })

  // Report scroll position for preview sync.
  const onScrollRatioRef = useRef(onScrollRatio)
  useEffect(() => {
    onScrollRatioRef.current = onScrollRatio
  }, [onScrollRatio])
  useEffect(() => {
    const scroller = viewRef.current?.scrollDOM
    if (scroller === undefined) {
      return
    }
    const onScroll = () => {
      const scrollable = scroller.scrollHeight - scroller.clientHeight
      if (scrollable > 0) {
        onScrollRatioRef.current?.(scroller.scrollTop / scrollable)
      }
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [viewRef])

  useImperativeHandle(ref, () => ({
    runTool: (tool) => {
      const view = viewRef.current
      if (view !== null) {
        onToolStatusRef.current?.(applyToolToEditor(view, tool))
        view.focus()
      }
    },
    focus: () => viewRef.current?.focus(),
  }))

  return <div className="editor-pane" ref={containerRef} data-testid="editor-pane" />
}
