/**
 * Modal for starting a compare: pick another open tab, or a file from
 * disk (reusing the M6 file picker — a compare target is never added as
 * a real tab, just read once).
 */
import { useEffect, useRef } from 'react'
import { pickAndReadFile } from '../files/fileOperations'
import { detectLanguage } from '../editor/languages'
import type { NotepadDocument } from '../types/document'
import type { CompareSide } from './CompareView'
import './CompareDialog.css'

export interface CompareDialogProps {
  /** Every open tab except the one being compared from. */
  otherDocuments: NotepadDocument[]
  onPick: (side: CompareSide) => void
  onCancel: () => void
}

export function CompareDialog({ otherDocuments, onPick, onCancel }: CompareDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.querySelector('button')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  const openFileToCompare = () => {
    pickAndReadFile()
      .then((opened) => {
        if (opened !== null) {
          onPick({
            name: opened.name,
            content: opened.content,
            language: detectLanguage(opened.name),
          })
        }
      })
      .catch(() => {
        // A failed/cancelled picker just leaves the dialog open.
      })
  }

  return (
    <div className="compare-dialog-backdrop" onClick={onCancel}>
      <div
        className="compare-dialog"
        role="dialog"
        aria-label="Compare with"
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="compare-dialog-title">Compare with…</h2>
        {otherDocuments.length > 0 && (
          <ul className="compare-dialog-list">
            {otherDocuments.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  className="compare-dialog-item"
                  onClick={() =>
                    onPick({ name: doc.name, content: doc.content, language: doc.language })
                  }
                >
                  {doc.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="compare-dialog-file" onClick={openFileToCompare}>
          Open a file to compare…
        </button>
        <button type="button" className="compare-dialog-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
