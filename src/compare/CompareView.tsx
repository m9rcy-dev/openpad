/**
 * Read-only side-by-side diff, the Notepad++ "Compare" plugin equivalent.
 * All diffing and highlighting comes from @codemirror/merge's MergeView —
 * this component only supplies read-only, themed editor state for each
 * side and the header/close chrome around it.
 */
import { useEffect, useRef } from 'react'
import { MergeView } from '@codemirror/merge'
import { EditorState, type Extension } from '@codemirror/state'
import { baseExtensions } from '../editor/extensions'
import { languageExtension } from '../editor/languages'
import type { DocumentLanguage } from '../types/document'
import './CompareView.css'

export interface CompareSide {
  name: string
  content: string
  language: DocumentLanguage
}

export interface CompareViewProps {
  left: CompareSide
  right: CompareSide
  onClose: () => void
}

function readOnlySide(language: DocumentLanguage): Extension {
  return [baseExtensions(), languageExtension(language), EditorState.readOnly.of(true)]
}

export function CompareView({ left, right, onClose }: CompareViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (container === null) {
      return
    }
    const view = new MergeView({
      a: { doc: left.content, extensions: readOnlySide(left.language) },
      b: { doc: right.content, extensions: readOnlySide(right.language) },
      parent: container,
      highlightChanges: true,
      gutter: true,
    })
    return () => view.destroy()
  }, [left, right])

  return (
    <div className="compare-view">
      <div className="compare-header">
        <span className="compare-title">
          Compare: {left.name} ⟷ {right.name}
        </span>
        <span className="compare-readonly">read-only</span>
        <button type="button" className="compare-close" onClick={onClose}>
          ✕ Close
        </button>
      </div>
      <div className="compare-panes" ref={containerRef} data-testid="compare-panes" />
    </div>
  )
}
