/**
 * Shows the generated share link: a read-only, auto-selected URL field
 * plus a Copy link button. Only ever opened when the active document
 * already passed `isOverShareLimit` (see `ToolsMenu`), and it's a modal
 * that blocks editing while open, so there's no in-dialog "too long"
 * state to handle here — see docs/openpad-feature-02-plan.md Part B,
 * Design decision 1.
 *
 * The link is built here (not by the caller) because `buildShareUrl` is
 * async — it gzip-compresses `content` via `CompressionStream` — see
 * docs/openpad-feature-03-plan.md Part B. While that's in flight, the
 * field shows a placeholder and Copy is disabled.
 */
import { useEffect, useRef, useState } from 'react'
import { buildShareUrl } from '../../share/shareLink'
import './ShareDialog.css'

export interface ShareDialogProps {
  content: string
  onClose: () => void
  /** Reports whether the clipboard write succeeded, for a status notice. */
  onCopyResult: (success: boolean) => void
}

export function ShareDialog({ content, onClose, onCopyResult }: ShareDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void buildShareUrl(content).then((built) => {
      if (!cancelled) {
        setUrl(built)
      }
    })
    return () => {
      cancelled = true
    }
  }, [content])

  useEffect(() => {
    if (url === null) {
      return
    }
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [url])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleCopy = async () => {
    if (url === null) {
      return
    }
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
          The content lives entirely in this link — there's no server copy, so anyone you send it to
          sees exactly what's here now.
        </p>
        <input
          ref={inputRef}
          type="text"
          className="share-dialog-url"
          value={url ?? 'Generating link…'}
          readOnly
          aria-label="Share link"
          onFocus={(event) => event.target.select()}
        />
        <button
          type="button"
          className="share-dialog-copy"
          disabled={url === null}
          onClick={() => void handleCopy()}
        >
          Copy link
        </button>
      </div>
    </div>
  )
}
