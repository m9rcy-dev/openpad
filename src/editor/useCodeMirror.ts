/**
 * React ↔ CodeMirror bridge.
 *
 * CodeMirror owns its own state; React owns the application state. This
 * hook keeps the two in sync:
 *
 * - Edits inside the editor flow up through `onChange`.
 * - External changes to `value` (e.g. a transform tool rewriting the
 *   document, or a tab switch in M3) are dispatched into the editor.
 * - `language` swaps are applied through a Compartment, so the view is
 *   never recreated after mount.
 */
import { useEffect, useRef } from 'react'
import { Compartment, EditorState, type Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import type { CursorInfo, DocumentLanguage } from '../types/document'
import { baseExtensions } from './extensions'
import { languageExtension } from './languages'

export interface UseCodeMirrorOptions {
  /** The document text this editor should display. */
  value: string
  language: DocumentLanguage
  /** Called with the full document text after every edit made in the editor. */
  onChange: (text: string) => void
  /** Called when the cursor or selection moves. */
  onCursorChange?: (cursor: CursorInfo) => void
  /**
   * Additional extensions appended at creation time (e.g. tool-shortcut
   * keymaps). Captured on mount — later changes are ignored.
   */
  extraExtensions?: Extension
}

export interface UseCodeMirrorResult {
  containerRef: React.RefObject<HTMLDivElement | null>
  /** The live view; null before mount and after unmount. */
  viewRef: React.RefObject<EditorView | null>
}

/** Reads the primary cursor position out of an editor state. */
function cursorInfo(state: EditorState): CursorInfo {
  const range = state.selection.main
  const line = state.doc.lineAt(range.head)
  return {
    line: line.number,
    column: range.head - line.from + 1,
    selectionLength: Math.abs(range.to - range.from),
  }
}

/**
 * Mounts a CodeMirror editor into the returned container ref.
 *
 * @example
 * const containerRef = useCodeMirror({ value, language: 'markdown', onChange: setValue })
 * return <div ref={containerRef} />
 */
export function useCodeMirror({
  value,
  language,
  onChange,
  onCursorChange,
  extraExtensions,
}: UseCodeMirrorOptions): UseCodeMirrorResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const languageCompartment = useRef(new Compartment())

  // Callbacks live in refs so the update listener (created once) always
  // calls the latest versions without the view being rebuilt on re-render.
  const onChangeRef = useRef(onChange)
  const onCursorChangeRef = useRef(onCursorChange)
  useEffect(() => {
    onChangeRef.current = onChange
    onCursorChangeRef.current = onCursorChange
  }, [onChange, onCursorChange])

  // Create the view once on mount, destroy it on unmount.
  useEffect(() => {
    const container = containerRef.current
    if (container === null) {
      return
    }

    const view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: value,
        extensions: [
          baseExtensions(),
          extraExtensions ?? [],
          languageCompartment.current.of(languageExtension(language)),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString())
            }
            if (update.selectionSet || update.docChanged) {
              onCursorChangeRef.current?.(cursorInfo(update.state))
            }
          }),
        ],
      }),
    })
    viewRef.current = view
    onCursorChangeRef.current?.(cursorInfo(view.state))

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // The view intentionally mounts once; `value` and `language` updates
    // are handled by the sync effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push external `value` changes into the editor (no-op for edits that
  // originated here, because the text is already identical).
  useEffect(() => {
    const view = viewRef.current
    if (view === null) {
      return
    }
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  // Swap the language extension when the document language changes.
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: languageCompartment.current.reconfigure(languageExtension(language)),
    })
  }, [language])

  return { containerRef, viewRef }
}
