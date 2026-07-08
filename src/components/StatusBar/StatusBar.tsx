/**
 * Bottom status bar, per the design target: cursor position, document
 * counts, language, and (from M3 on) autosave state.
 */
import type { CursorInfo, DocumentLanguage } from '../../types/document'
import { LANGUAGE_LABELS } from '../../types/document'
import type { SaveState } from '../../store/documentsStore'
import { countWords } from '../../utils/text'
import './StatusBar.css'

/** Transient outcome message from the last tool run. */
export interface StatusNotice {
  kind: 'error' | 'success'
  text: string
}

export interface StatusBarProps {
  cursor: CursorInfo
  /** Full document text; counts are derived here. */
  text: string
  language: DocumentLanguage
  /** Autosave lifecycle; omitted (idle) renders no indicator. */
  saveState?: SaveState
  /** Tool outcome to display; null shows nothing. */
  notice?: StatusNotice | null
}

const SAVE_LABELS: Record<SaveState, string> = {
  idle: '',
  saving: 'saving…',
  saved: '✓ autosaved',
}

export function StatusBar({
  cursor,
  text,
  language,
  saveState = 'idle',
  notice = null,
}: StatusBarProps) {
  const selection =
    cursor.selectionLength > 0 ? ` (${cursor.selectionLength.toLocaleString()} selected)` : ''

  return (
    <footer className="status-bar" role="status" data-testid="status-bar">
      <span>
        Ln {cursor.line}, Col {cursor.column}
        {selection}
      </span>
      <span>
        {text.length.toLocaleString()} chars · {countWords(text).toLocaleString()} words
      </span>
      <span>{LANGUAGE_LABELS[language]}</span>
      <span className="status-bar-spacer" />
      {notice !== null && (
        <span
          className={notice.kind === 'error' ? 'status-bar-error' : 'status-bar-success'}
          role="alert"
        >
          {notice.text}
        </span>
      )}
      {saveState !== 'idle' && <span className="status-bar-saved">{SAVE_LABELS[saveState]}</span>}
      <span>UTF-8</span>
    </footer>
  )
}
