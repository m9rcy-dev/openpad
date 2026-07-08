/**
 * Notepad++-style tab strip: one tab per document, a dirty-dot on
 * modified documents, double-click to rename, ✕ (or middle-click) to
 * close, and a trailing "+" to create a document.
 */
import { useEffect, useRef, useState } from 'react'
import type { NotepadDocument } from '../../types/document'
import './TabBar.css'

export interface TabBarProps {
  documents: NotepadDocument[]
  activeId: string | null
  onActivate: (id: string) => void
  onCreate: () => void
  /**
   * Requests closing a document. Confirmation for unsaved changes is the
   * parent's decision (App owns the dialog), keeping this component pure.
   */
  onClose: (id: string) => void
  onRename: (id: string, name: string) => void
}

export function TabBar({
  documents,
  activeId,
  onActivate,
  onCreate,
  onClose,
  onRename,
}: TabBarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null)

  return (
    <div className="tab-bar" role="tablist" aria-label="Open documents">
      {documents.map((doc) =>
        renamingId === doc.id ? (
          <RenameInput
            key={doc.id}
            initialName={doc.name}
            onSubmit={(name) => {
              onRename(doc.id, name)
              setRenamingId(null)
            }}
            onCancel={() => setRenamingId(null)}
          />
        ) : (
          <button
            key={doc.id}
            type="button"
            role="tab"
            aria-selected={doc.id === activeId}
            className={doc.id === activeId ? 'tab tab-active' : 'tab'}
            onClick={() => onActivate(doc.id)}
            onDoubleClick={() => setRenamingId(doc.id)}
            onAuxClick={(event) => {
              if (event.button === 1) {
                onClose(doc.id)
              }
            }}
            title={`${doc.name} — double-click to rename`}
          >
            {doc.dirty && <span className="tab-dirty" aria-label="Unsaved changes" />}
            <span className="tab-name">{doc.name}</span>
            <span
              className="tab-close"
              role="button"
              aria-label={`Close ${doc.name}`}
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation()
                onClose(doc.id)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.stopPropagation()
                  onClose(doc.id)
                }
              }}
            >
              ✕
            </span>
          </button>
        ),
      )}
      <button type="button" className="tab tab-new" onClick={onCreate} aria-label="New document">
        +
      </button>
    </div>
  )
}

interface RenameInputProps {
  initialName: string
  onSubmit: (name: string) => void
  onCancel: () => void
}

/** Inline tab-rename field: Enter commits, Escape cancels, blur commits. */
function RenameInput({ initialName, onSubmit, onCancel }: RenameInputProps) {
  const [name, setName] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <input
      ref={inputRef}
      className="tab tab-rename"
      value={name}
      aria-label="Rename document"
      onChange={(event) => setName(event.target.value)}
      onBlur={() => onSubmit(name)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onSubmit(name)
        } else if (event.key === 'Escape') {
          onCancel()
        }
      }}
    />
  )
}
