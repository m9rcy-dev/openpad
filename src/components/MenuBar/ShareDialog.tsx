/**
 * Shows the generated share link: a read-only, auto-selected URL field
 * plus a Copy link button. Only ever opened when the active document
 * already passed `isOverShareLimit` (see `ToolsMenu`), and it's a modal
 * that blocks editing while open, so there's no in-dialog "too long"
 * state to handle here — see docs/openpad-feature-02-plan.md Part B,
 * Design decision 1.
 */
import { useEffect, useRef } from 'react'
import './ShareDialog.css'

export interface ShareDialogProps {
  url: string
  onClose: () => void
  /** Reports whether the clipboard write succeeded, for a status notice. */
  onCopyResult: (success: boolean) => void
}

export function ShareDialog({ url, onClose, onCopyResult }: ShareDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      onCopyResult(true)
    } catch {
      onCopyResult(false)
    }
  }

  return (
    <div className="share-dialog-backdrop" onClick={onClose}>
      <div
        className="share-dialog"
        role="dialog"
        aria-label="Share"
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="share-dialog-header">
          <h2 className="share-dialog-title">Share</h2>
          <button type="button" className="share-dialog-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="share-dialog-hint">
          The content lives entirely in this link — there's no server copy, so anyone you send it
          to sees exactly what's here now.
        </p>
        <input
          ref={inputRef}
          type="text"
          className="share-dialog-url"
          value={url}
          readOnly
          aria-label="Share link"
          onFocus={(event) => event.target.select()}
        />
        <button type="button" className="share-dialog-copy" onClick={() => void handleCopy()}>
          Copy link
        </button>
      </div>
    </div>
  )
}
